from dataclasses import dataclass

from apps.recepcion.services.errors import VisitDomainError

ROLE_RECEPCION = "RECEPCION"
ROLE_SOMATOMETRIA = "SOMATOMETRIA"
ROLE_DOCTOR = "DOCTOR"

VISIT_STATES = (
    "en_espera",
    "en_somatometria",
    "lista_para_doctor",
    "en_consulta",
    "cerrada",
    "cancelada",
    "no_show",
)


@dataclass(frozen=True)
class TransitionRule:
    action: str
    allowed_roles: frozenset
    requires_complete_vitals: bool = False
    requires_close_fields: bool = False


TRANSITION_RULES = {
    ("en_espera", "en_somatometria"): TransitionRule(
        action="iniciar_somatometria",
        allowed_roles=frozenset({ROLE_RECEPCION}),
    ),
    ("en_espera", "cancelada"): TransitionRule(
        action="cancelar_visita",
        allowed_roles=frozenset({ROLE_RECEPCION}),
    ),
    ("en_espera", "no_show"): TransitionRule(
        action="marcar_no_show",
        allowed_roles=frozenset({ROLE_RECEPCION}),
    ),
    ("en_somatometria", "lista_para_doctor"): TransitionRule(
        action="liberar_a_doctor",
        allowed_roles=frozenset({ROLE_SOMATOMETRIA}),
        requires_complete_vitals=True,
    ),
    ("lista_para_doctor", "en_consulta"): TransitionRule(
        action="iniciar_consulta",
        allowed_roles=frozenset({ROLE_DOCTOR}),
    ),
    ("en_consulta", "cerrada"): TransitionRule(
        action="cerrar_consulta",
        allowed_roles=frozenset({ROLE_DOCTOR}),
        requires_close_fields=True,
    ),
}


def transition_visit_state(
    current_state,
    target_state,
    actor_role,
    *,
    vitals_complete=False,
    primary_diagnosis=None,
    final_note=None,
):
    if not _is_known_state(current_state) or not _is_known_state(target_state):
        raise _invalid_state_error(current_state, target_state)

    rule = TRANSITION_RULES.get((current_state, target_state))
    if rule is None:
        raise _invalid_state_error(current_state, target_state)

    normalized_role = _normalize_role(actor_role)
    if normalized_role not in rule.allowed_roles:
        raise VisitDomainError(
            "ROLE_NOT_ALLOWED",
            "No tenes permiso para ejecutar esta accion.",
            403,
        )

    if rule.requires_complete_vitals and not vitals_complete:
        raise VisitDomainError(
            "VITALS_INCOMPLETE",
            "No se puede enviar a doctor: faltan signos vitales obligatorios.",
            422,
        )

    if rule.requires_close_fields and not _has_required_close_fields(
        primary_diagnosis,
        final_note,
    ):
        raise VisitDomainError(
            "VISIT_STATE_INVALID",
            "No se puede cerrar consulta: falta diagnostico o nota final.",
            409,
        )

    return target_state


def get_transition_matrix():
    matrix = []

    for current_state in VISIT_STATES:
        for target_state in VISIT_STATES:
            rule = TRANSITION_RULES.get((current_state, target_state))
            if rule is None:
                matrix.append(
                    {
                        "current_state": current_state,
                        "action": "cambiar_estado",
                        "target_state": target_state,
                        "is_valid": False,
                        "reason": "VISIT_STATE_INVALID",
                    }
                )
                continue

            matrix.append(
                {
                    "current_state": current_state,
                    "action": rule.action,
                    "target_state": target_state,
                    "is_valid": True,
                    "reason": "VALID",
                }
            )

    return matrix


def _normalize_role(actor_role):
    return (actor_role or "").strip().upper()


def _is_known_state(state):
    return state in VISIT_STATES


def _has_required_close_fields(primary_diagnosis, final_note):
    return _has_content(primary_diagnosis) and _has_content(final_note)


def _has_content(value):
    return isinstance(value, str) and bool(value.strip())


def _invalid_state_error(current_state, target_state):
    return VisitDomainError(
        "VISIT_STATE_INVALID",
        f"Transicion no permitida: {current_state} -> {target_state}.",
        409,
    )
