"""
apps/portal_citas/uses_case/cancelar_cita_usecase.py
=========================================================
Cancelación de cita del portal de autoservicio (Fase 6).

Flujo (validaciones en este orden):

1. Se busca la ``CitaMedica`` por ``folio``. Si no existe -> 404 genérico.
2. Autorización: se resuelve el ``PortalMiembro`` dueño de la cita a partir
   de ``cita.no_exp``/``cita.pk_num`` (misma tupla que identifica a un
   miembro del núcleo, ver ``apps.portal_citas.models.PortalMiembro`` y
   ``services.nucleo_service``) y se reusa
   ``services.nucleo_service.puede_gestionar_miembro`` (misma regla que la
   reserva de Fase 4 y el núcleo de Fase 3) para confirmar que la sesión
   actual puede gestionar a ese paciente. Si el miembro no existe o no está
   autorizado -> 403 genérico, sin distinguir el motivo.
3. Estado válido: solo se puede cancelar una cita en ``agendada`` o
   ``confirmada`` -- si ya está ``atendida``, ``cancelada`` o
   ``no_asistio`` -> 409.
4. Ventana mínima de tiempo: si falta menos de
   ``settings.PORTAL_CANCELACION_VENTANA_HORAS`` para ``fecha_hora`` -> 409.
5. Transacción atómica (mismo patrón que
   ``reservar_cita_usecase.reservar_cita``, con ``select_for_update()``):
   se bloquea la ``CitaMedica`` y su ``HorarioDisponible`` asociado (acceso
   vía ``HorarioDisponible.objects.filter(cita=cita)`` -- el
   ``related_name`` inverso ``cita.slot`` no sirve acá porque necesitamos
   ``select_for_update()`` sobre el queryset, no sobre el objeto ya
   cacheado). Se re-valida el estatus DESPUÉS de tomar el lock (defensa
   contra una carrera entre el chequeo del paso 3, sin lock, y este punto
   -- ej. dos pestañas cancelando la misma cita al mismo tiempo). Se marca
   ``estatus="cancelada"``, ``cancelado_en=now()``,
   ``cancelado_por_id=None`` (autogestionado -- no hay usuario de staff
   detrás, mismo criterio que ``created_by_id=None`` en la reserva de Fase
   4) y ``motivo_cancelacion`` (opcional, del body). El slot se libera por
   completo: ``cita=None`` + ``disponible=True`` (nunca queda
   ``disponible=True`` apuntando todavía a la cita cancelada -- sería un
   estado inconsistente que un doble-booking podría explotar).
6. (Fase 6) Ya confirmada la transacción anterior, se encola
   ``tasks.enviar_cancelacion_portal_task`` con ``.delay(...)`` para
   mandar el correo de cancelación en background -- este endpoint NO
   espera a que el correo se envíe para responder, y un fallo de Celery
   nunca debe tumbar la respuesta.
7. Se devuelven solo datos no sensibles (``folio`` + ``estatus``), nunca
   ``no_exp``/``pk_num`` ni datos de otro paciente.

Fuera de alcance (fases posteriores): check-in / validación del QR en
recepción (Fase 7).
"""

import logging
from datetime import timedelta

from django.conf import settings
from django.db import transaction
from django.utils import timezone

from apps.portal_citas.errors import PortalCancelacionError
from apps.portal_citas.models import PortalMiembro
from apps.portal_citas.services.nucleo_service import puede_gestionar_miembro
from apps.portal_citas.tasks import enviar_cancelacion_portal_task
from apps.recepcion.models import CitaMedica, EstatusCita, HorarioDisponible

logger = logging.getLogger(__name__)

# Solo se puede cancelar una cita que todavía no ocurrió ni fue resuelta.
ESTATUS_CANCELABLES = (EstatusCita.AGENDADA, EstatusCita.CONFIRMADA)


def _validar_estatus_cancelable(estatus: str) -> None:
    if estatus not in ESTATUS_CANCELABLES:
        raise PortalCancelacionError(
            "ESTADO_NO_CANCELABLE",
            f'La cita está en estatus "{estatus}" y ya no se puede cancelar.',
            409,
        )


def cancelar_cita(
    miembro_sesion: PortalMiembro,
    folio: str,
    motivo: str | None = None,
) -> dict:
    cita = CitaMedica.objects.filter(folio=folio).first()
    if cita is None:
        raise PortalCancelacionError(
            "CITA_NO_ENCONTRADA",
            "La cita no existe.",
            404,
        )

    # No se distingue "miembro no existe" de "no autorizado": mismo mensaje
    # genérico en ambos casos, igual que en la reserva de Fase 4, para no
    # revelar detalles a un atacante que adivinó un folio ajeno.
    miembro_objetivo = PortalMiembro.objects.filter(
        no_exp=cita.no_exp, pk_num=cita.pk_num
    ).first()
    if miembro_objetivo is None or not puede_gestionar_miembro(
        miembro_sesion, miembro_objetivo.id
    ):
        raise PortalCancelacionError(
            "NO_AUTORIZADO",
            "No puedes cancelar esa cita.",
            403,
        )

    _validar_estatus_cancelable(cita.estatus)

    ventana = timedelta(hours=settings.PORTAL_CANCELACION_VENTANA_HORAS)
    if cita.fecha_hora - timezone.now() < ventana:
        raise PortalCancelacionError(
            "FUERA_DE_VENTANA",
            "Ya no se puede cancelar, faltan menos de "
            f"{settings.PORTAL_CANCELACION_VENTANA_HORAS} horas para la cita.",
            409,
        )

    with transaction.atomic():
        cita = CitaMedica.objects.select_for_update().get(id=cita.id)
        # Re-chequeo post-lock: entre la validación de arriba (sin lock) y
        # este punto, otra request pudo haber cancelado/atendido la misma
        # cita primero.
        _validar_estatus_cancelable(cita.estatus)

        slot = (
            HorarioDisponible.objects.select_for_update()
            .filter(cita=cita)
            .first()
        )

        cita.estatus = EstatusCita.CANCELADA
        cita.cancelado_en = timezone.now()
        # Autogestionado por el propio paciente/derechohabiente desde el
        # portal -- no hay un usuario de staff detrás, por eso queda en
        # None (mismo criterio que created_by_id=None en la reserva de
        # Fase 4).
        cita.cancelado_por_id = None
        cita.motivo_cancelacion = motivo or None
        cita.save(
            update_fields=[
                "estatus",
                "cancelado_en",
                "cancelado_por_id",
                "motivo_cancelacion",
                "updated_at",
            ]
        )

        if slot is not None:
            # Se deja el slot completamente libre para que cualquiera lo
            # pueda re-reservar -- nunca disponible=True todavía apuntando
            # a la cita ya cancelada.
            slot.cita = None
            slot.disponible = True
            slot.save(update_fields=["cita", "disponible"])

    # La cancelación ya quedó confirmada (transacción cerrada arriba) -- el
    # envío del correo se dispara async y nunca debe tumbar la respuesta si
    # Celery/Redis no está disponible.
    try:
        enviar_cancelacion_portal_task.delay(
            folio=cita.folio,
            miembro_sesion_id=str(miembro_sesion.id),
        )
    except Exception:
        logger.exception(
            "No se pudo encolar el envío del correo de cancelación portal para folio %s",
            cita.folio,
        )

    return {"folio": cita.folio, "estatus": cita.estatus}
