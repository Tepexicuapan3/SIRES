from dataclasses import dataclass

from apps.recepcion.models import EstatusCita
from apps.recepcion.services.errors import VisitDomainError

CITA_STATES = (
    EstatusCita.AGENDADA,
    EstatusCita.CONFIRMADA,
    EstatusCita.ATENDIDA,
    EstatusCita.CANCELADA,
    EstatusCita.NO_ASISTIO,
)

_MOTIVO_REQUERIDO = frozenset({EstatusCita.CANCELADA, EstatusCita.NO_ASISTIO})


@dataclass(frozen=True)
class CitaTransitionRule:
    action: str
    requires_motivo: bool = False


# agendada/confirmada son los únicos estados de origen: atendida, cancelada
# y no_asistio son terminales (mismo criterio ya usado por
# ESTATUS_CANCELABLES y _ESTATUS_NO_CHECKIN en el resto del módulo).
TRANSITION_RULES = {
    (EstatusCita.AGENDADA, EstatusCita.CONFIRMADA): CitaTransitionRule("confirmar"),
    (EstatusCita.AGENDADA, EstatusCita.ATENDIDA):   CitaTransitionRule("marcar_atendida"),
    (EstatusCita.AGENDADA, EstatusCita.CANCELADA):  CitaTransitionRule("cancelar", requires_motivo=True),
    (EstatusCita.AGENDADA, EstatusCita.NO_ASISTIO): CitaTransitionRule("marcar_no_asistio", requires_motivo=True),
    (EstatusCita.CONFIRMADA, EstatusCita.ATENDIDA):   CitaTransitionRule("marcar_atendida"),
    (EstatusCita.CONFIRMADA, EstatusCita.CANCELADA):  CitaTransitionRule("cancelar", requires_motivo=True),
    (EstatusCita.CONFIRMADA, EstatusCita.NO_ASISTIO): CitaTransitionRule("marcar_no_asistio", requires_motivo=True),
}


def transition_cita_state(current_state, target_state, *, motivo=None):
    """
    ``motivo`` es el motivo tipificado (instancia/PK de
    ``catalogos.MotivoCita``, o cualquier valor truthy) requerido para
    cancelar/marcar no asistió -- ya no un texto libre (ver Fase de
    catálogo MotivoCita). ``_has_content`` acepta tanto strings (texto
    libre, uso legado en tests) como cualquier otro valor truthy (FK id o
    instancia de modelo).
    """
    if not _is_known_state(current_state) or not _is_known_state(target_state):
        raise _invalid_state_error(current_state, target_state)

    rule = TRANSITION_RULES.get((current_state, target_state))
    if rule is None:
        raise _invalid_state_error(current_state, target_state)

    if rule.requires_motivo and not _has_content(motivo):
        raise VisitDomainError(
            "CITA_MOTIVO_REQUERIDO",
            "Se requiere un motivo para cancelar o marcar no asistió.",
            422,
        )

    return target_state


def get_transition_matrix():
    matrix = []
    for current_state in CITA_STATES:
        for target_state in CITA_STATES:
            rule = TRANSITION_RULES.get((current_state, target_state))
            if rule is None:
                matrix.append({
                    "current_state": current_state,
                    "action": "cambiar_estado",
                    "target_state": target_state,
                    "is_valid": False,
                    "reason": "CITA_STATE_INVALID",
                })
                continue
            matrix.append({
                "current_state": current_state,
                "action": rule.action,
                "target_state": target_state,
                "is_valid": True,
                "reason": "VALID",
            })
    return matrix


def _is_known_state(state):
    return state in CITA_STATES


def _has_content(value):
    if isinstance(value, str):
        return bool(value.strip())
    return value is not None and bool(value)


def _invalid_state_error(current_state, target_state):
    return VisitDomainError(
        "CITA_STATE_INVALID",
        f"Transicion no permitida: {current_state} -> {target_state}.",
        409,
    )
