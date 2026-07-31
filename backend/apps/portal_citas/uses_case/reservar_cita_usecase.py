"""
apps/portal_citas/uses_case/reservar_cita_usecase.py
=======================================================
Reserva de cita del portal de autoservicio (Fase 4).

Flujo:
1. Autorización: el ``miembroId`` destino debe estar entre los que la
   sesión actual puede gestionar — se reusa
   ``services.nucleo_service.puede_gestionar_miembro`` (misma regla que
   ``GET /portal/nucleo``, Fase 3), no se reimplementa acá. Si no está
   autorizado (o el miembro no existe) se responde el mismo error genérico,
   sin distinguir el motivo, para no darle pistas a un atacante.
2. Bloqueo transaccional del slot elegido (``select_for_update``) para
   evitar doble reserva concurrente. Si el slot ya no está disponible, no
   es de canal apto para portal, o no existe -> conflicto (409).
3. Los datos del paciente (``no_exp``/``pk_num``) se toman directo del
   ``PortalMiembro`` destino -- ``CitaMedica`` NO persiste el nombre del
   paciente (solo ``no_exp``/``pk_num``, ver ``apps.recepcion.models``), así
   que no hace falta una consulta adicional a ``CatEmpleado``/``CatFamiliar``
   vía ``identity_service`` (esa resolución ya se hizo una vez, en el login
   o al construir el núcleo — reconsultarla acá sería una query redundante).
4. ``servicio_tipo`` se deriva del médico del slot (regla confirmada en
   Fase 3/4: al menos una fila en ``RelMedicoEspecialidad`` ->
   ``"especialidad"``; ninguna -> ``"medicina_general"``; ``"urgencias"``
   no es seleccionable desde el portal).
5. Se crea ``CitaMedica`` reusando ``CitaMedica.generar_folio()`` (mismo
   mecanismo que usa ``CitasRepository.create`` en recepción -- no se
   inventa un esquema de folio nuevo). ``created_by_id`` se deja en
   ``None``: es nullable y esta cita no la crea un usuario de staff.
6. Se vincula el slot a la cita y se marca ``disponible=False`` dentro de
   la misma transacción que lo bloqueó.
7. Se devuelven solo datos no sensibles (nunca ``no_exp``/``pk_num`` ni
   datos de otros pacientes).
8. (Fase 5) Ya confirmada la transacción anterior, se encola
   ``tasks.enviar_comprobante_portal_task`` con ``.delay(...)`` para que
   genere el PDF+QR y mande el comprobante por correo en background --
   este endpoint NO espera a que el correo se envíe para responder.

Fuera de alcance (fases posteriores): cancelación (Fase 6), validación del
QR en el check-in de recepción (Fase 7).
"""

import logging
from datetime import datetime, timedelta

from django.db import transaction
from django.utils import timezone

from apps.portal_citas.errors import PortalReservaError
from apps.portal_citas.models import PortalMiembro
from apps.portal_citas.services.nucleo_service import puede_gestionar_miembro
from apps.portal_citas.tasks import enviar_comprobante_portal_task
from apps.recepcion.models import CitaMedica, EstatusCita, HorarioDisponible

logger = logging.getLogger(__name__)


def _servicio_tipo_de(medico) -> str:
    return "especialidad" if medico.especialidades.exists() else "medicina_general"


def _nombre_medico(medico) -> str:
    det = getattr(medico.id_usuario, "detalle", None)
    return det.nombre_completo if det else medico.id_usuario.usuario


def _combinar_fecha_hora(fecha, hora):
    combinado = datetime.combine(fecha, hora)
    if timezone.is_naive(combinado):
        combinado = timezone.make_aware(combinado)
    return combinado


def reservar_cita(
    miembro_sesion: PortalMiembro,
    miembro_objetivo_id,
    slot_id: int,
    motivo: str | None = None,
) -> dict:
    miembro_objetivo = PortalMiembro.objects.filter(id=miembro_objetivo_id).first()

    # No se distingue "no existe" de "no autorizado": mismo mensaje genérico
    # en ambos casos para no revelar detalles a un atacante.
    if miembro_objetivo is None or not puede_gestionar_miembro(
        miembro_sesion, miembro_objetivo_id
    ):
        raise PortalReservaError(
            "NO_AUTORIZADO",
            "No puedes agendar una cita para ese miembro.",
            403,
        )

    with transaction.atomic():
        # Lock sobre el paciente destino: serializa dos intentos concurrentes
        # de reservar para la MISMA persona (aunque sean slots distintos), lo
        # que permite que el chequeo de traslape de abajo sea confiable y no
        # solo una lectura suelta susceptible de condición de carrera.
        PortalMiembro.objects.select_for_update().get(id=miembro_objetivo.id)

        slot = (
            HorarioDisponible.objects
            .select_for_update()
            .filter(id=slot_id, disponible=True, canal__in=["LINEA", "AMBOS"])
            .select_related("medico__id_usuario__detalle", "consultorio")
            .first()
        )
        if slot is None:
            raise PortalReservaError(
                "SLOT_NO_DISPONIBLE",
                "Ese horario ya no está disponible.",
                409,
            )

        # El slot bloqueado arriba solo evita que DOS personas reserven el
        # MISMO slot exacto. Falta validar que el MISMO paciente no termine
        # con dos citas en horarios que se superponen con médicos/consultorios
        # distintos -- se hace ya con el paciente lockeado, para que quede
        # protegido por ese lock.
        inicio_nuevo = _combinar_fecha_hora(slot.fecha, slot.hora)
        fin_nuevo = inicio_nuevo + timedelta(minutes=slot.duracion_min)

        citas_activas = CitaMedica.objects.filter(
            no_exp=miembro_objetivo.no_exp,
            pk_num=miembro_objetivo.pk_num,
            estatus__in=[EstatusCita.AGENDADA, EstatusCita.CONFIRMADA],
        )
        for existente in citas_activas:
            fin_existente = existente.fecha_hora + timedelta(
                minutes=existente.duracion_min
            )
            if existente.fecha_hora < fin_nuevo and fin_existente > inicio_nuevo:
                raise PortalReservaError(
                    "CITA_SUPERPUESTA",
                    "Ya tenés otra cita agendada en un horario que se cruza "
                    "con este.",
                    409,
                )

        cita = CitaMedica.objects.create(
            folio=CitaMedica.generar_folio(),
            no_exp=miembro_objetivo.no_exp,
            pk_num=miembro_objetivo.pk_num,
            medico=slot.medico,
            consultorio=slot.consultorio,
            fecha_hora=inicio_nuevo,
            duracion_min=slot.duracion_min,
            servicio_tipo=_servicio_tipo_de(slot.medico),
            estatus=EstatusCita.AGENDADA,
            motivo=motivo or None,
            origen_canal="PORTAL",
            # created_by_id queda None (nullable): esta cita no la crea un
            # usuario de staff, la crea el propio paciente desde el portal.
        )

        slot.cita = cita
        slot.disponible = False
        slot.save(update_fields=["cita", "disponible"])

    # Fase 5: la cita ya quedó confirmada (transacción cerrada arriba) --
    # el envío del comprobante por correo se dispara async y nunca debe
    # tumbar la respuesta de la reserva si Celery/Redis no está disponible.
    try:
        enviar_comprobante_portal_task.delay(
            folio=cita.folio,
            miembro_objetivo_id=str(miembro_objetivo.id),
            miembro_sesion_id=str(miembro_sesion.id),
        )
    except Exception:
        logger.exception(
            "No se pudo encolar el envío del comprobante portal para folio %s",
            cita.folio,
        )

    return {
        "folio": cita.folio,
        "fechaHora": cita.fecha_hora.isoformat(),
        "consultorioNombre": slot.consultorio.name if slot.consultorio else None,
        "medicoNombre": _nombre_medico(slot.medico),
        "servicioTipo": cita.servicio_tipo,
    }
