"""
apps/portal_citas/services/slots_service.py
===============================================
Disponibilidad de horarios para el portal de autoservicio (Fase 3).

Replica el patrón de consulta de
``apps.recepcion.repositories.citas_repository.CitasRepository.get_slots_disponibles``
(mismo modelo ``HorarioDisponible``), agregando el filtro de canal apto
para portal.

PATCH (calendario visual disponible/ocupado): se retiró el filtro
``disponible=True`` de la query para que el endpoint traiga TAMBIÉN los
slots ocupados de la fecha consultada — así el frontend puede pintar el
calendario completo (verde/rojo) en vez de solo mostrar huecos sin
contexto. El campo de salida ``estado`` ahora refleja el valor real de
``HorarioDisponible.disponible`` (``"disponible"`` / ``"ocupado"``) en vez
de estar hardcodeado.

Deliberadamente SIGUE sin exponer quién ocupa un slot ocupado: el dict de
salida es exactamente el mismo shape que antes (``slotId, fecha, hora,
consultorioNombre, especialidadPrincipal, medicoNombre, estado``). La
query NO hace join con ``CitaMedica`` ni con datos del paciente — el
``select_related`` sigue limitado a ``medico`` y ``consultorio`` — así que
no hay forma de que un ``no_exp``, folio de cita o nombre de paciente se
filtre en la respuesta de un slot ocupado.

PATCH (post-verificación de Fase 3): el parámetro original ``servicioTipo``
solo hacía eco del valor recibido porque ``servicio_tipo`` (con choices
medicina_general/especialidad/urgencias) vive ÚNICAMENTE en ``CitaMedica`` y
no es una propiedad inherente del médico ni del horario. Se investigó y SÍ
existe un catálogo real de especialidades ya conectado a los médicos:
``apps.catalogos.models.Especialidades`` + ``apps.medicos.models.RelMedicoEspecialidad``
(tabla puente ``medico``/``especialidad``/``es_principal``). Se reemplazó el
parámetro por ``especialidad_id`` (filtro real) y el campo de salida
``servicioTipo`` (eco) por ``especialidadPrincipal`` (nombre de la
especialidad principal del médico, o el label de generalista si no tiene
ninguna — ver ``_especialidad_principal_nombre``).

Regla para la Fase 4 (NO implementada acá, solo documentada — la reserva de
citas es fase 4): al crear ``CitaMedica``, ``servicio_tipo`` debe derivarse
del médico elegido: si tiene AL MENOS UNA fila en ``RelMedicoEspecialidad``
-> ``"especialidad"``; si no tiene ninguna -> ``"medicina_general"``.
``"urgencias"`` queda fuera del alcance del portal (no seleccionable desde
acá — se asume manejo presencial en recepción; confirmar con el usuario
antes de dar esto por definitivo en la Fase 4).
"""

from datetime import date
from typing import Optional

from apps.medicos.models import CatMedico
from apps.recepcion.models import HorarioDisponible

SIN_ESPECIALIDAD_LABEL = "Medicina General"


def _especialidad_principal_nombre(medico: CatMedico) -> Optional[str]:
    """
    Nombre de la especialidad principal del médico (``es_principal=True``),
    o ``SIN_ESPECIALIDAD_LABEL`` si el médico no tiene ninguna especialidad
    asignada en ``RelMedicoEspecialidad`` (se lo trata como generalista de
    medicina general). Si tiene especialidades pero ninguna marcada como
    principal, se usa la primera como fallback razonable en vez de mostrar
    ``None`` (evita "perder" la información en la respuesta del slot).
    """
    especialidades = list(medico.especialidades.select_related("especialidad").all())
    if not especialidades:
        return SIN_ESPECIALIDAD_LABEL

    principal = next((e for e in especialidades if e.es_principal), especialidades[0])
    return principal.especialidad.name


def get_slots_portal(fecha: date, especialidad_id: Optional[int] = None) -> list[dict]:
    slots = (
        HorarioDisponible.objects
        .filter(
            fecha=fecha,
            canal__in=["LINEA", "AMBOS"],
        )
        .select_related("medico__id_usuario__detalle", "consultorio")
        .order_by("hora")
    )

    if especialidad_id is not None:
        slots = slots.filter(medico__especialidades__especialidad_id=especialidad_id)

    resultado = []
    for slot in slots:
        det = getattr(slot.medico.id_usuario, "detalle", None)
        nombre_medico = det.nombre_completo if det else slot.medico.id_usuario.usuario

        resultado.append({
            "slotId": slot.id,
            "fecha": str(slot.fecha),
            "hora": str(slot.hora)[:5],
            "consultorioNombre": slot.consultorio.name if slot.consultorio else None,
            "especialidadPrincipal": _especialidad_principal_nombre(slot.medico),
            "medicoNombre": nombre_medico,
            "estado": "disponible" if slot.disponible else "ocupado",
        })

    return resultado
