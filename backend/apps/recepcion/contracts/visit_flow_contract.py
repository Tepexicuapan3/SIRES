from apps.recepcion.services.errors import VisitDomainError


class VisitFlowContractError(VisitDomainError):
    """Stable contract error for cross-domain visit flow calls."""


def get_visit_by_id(visit_id):
    from apps.recepcion.repositories.visit_repository import VisitRepository

    return VisitRepository.get_by_id(visit_id)


def resolve_next_visit_state(current_state, *, vitals_complete=False):
    from apps.recepcion.uses_case.visit_state_machine_usecase import (
        ROLE_SOMATOMETRIA,
        transition_visit_state,
    )

    try:
        return transition_visit_state(
            current_state,
            "lista_para_doctor",
            ROLE_SOMATOMETRIA,
            vitals_complete=vitals_complete,
        )
    except VisitDomainError as exc:
        raise VisitFlowContractError(
            exc.code,
            exc.message,
            exc.status_code,
            details=exc.details,
        ) from exc


def update_visit_status(visit, next_state):
    from apps.recepcion.repositories.visit_repository import VisitRepository

    return VisitRepository.update_status(visit, next_state)
