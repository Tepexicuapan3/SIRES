from apps.recepcion.repositories.visit_repository import VisitRepository
from apps.recepcion.services.errors import VisitDomainError
from apps.recepcion.uses_case.visit_state_machine_usecase import (
    ROLE_RECEPCION,
    transition_visit_state,
)


def ensure_recepcion_role(roles):
    normalized_roles = {(role or "").strip().upper() for role in roles}
    if ROLE_RECEPCION not in normalized_roles:
        raise VisitDomainError(
            "ROLE_NOT_ALLOWED",
            "No tenes permiso para ejecutar esta accion.",
            403,
        )


def create_visit(patient_id, has_appointment):
    visit = VisitRepository.create(patient_id, has_appointment)
    return VisitRepository.to_contract(visit)


def list_visits(page, page_size):
    visits, total, total_pages = VisitRepository.list_paginated(page, page_size)
    return {
        "items": [VisitRepository.to_contract(visit) for visit in visits],
        "page": page,
        "pageSize": page_size,
        "total": total,
        "totalPages": total_pages,
    }


def change_visit_status(visit_id, target_status):
    visit = VisitRepository.get_by_id(visit_id)
    if not visit:
        raise VisitDomainError(
            "VISIT_NOT_FOUND",
            "Visita no encontrada.",
            404,
        )

    next_state = transition_visit_state(
        visit.status,
        target_status,
        ROLE_RECEPCION,
    )
    visit = VisitRepository.update_status(visit, next_state)
    return VisitRepository.to_contract(visit)
