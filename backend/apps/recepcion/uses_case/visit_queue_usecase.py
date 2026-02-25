from apps.authentication.services.permission_dependencies import (
    evaluate_permission_requirement,
)
from apps.recepcion.models import Visit
from apps.recepcion.repositories.visit_repository import VisitRepository
from apps.recepcion.services.errors import VisitDomainError
from apps.recepcion.uses_case.visit_state_machine_usecase import (
    ROLE_RECEPCION,
    transition_visit_state,
)

VISIT_QUEUE_PERMISSION_REQUIREMENT = {
    "anyOf": [
        "recepcion:fichas:medicina_general:create",
        "recepcion:fichas:especialidad:create",
        "recepcion:fichas:urgencias:create",
        "clinico:consultas:read",
        "clinico:somatometria:read",
    ]
}


def ensure_recepcion_role(roles):
    normalized_roles = {(role or "").strip().upper() for role in roles}
    if ROLE_RECEPCION not in normalized_roles:
        raise VisitDomainError(
            "ROLE_NOT_ALLOWED",
            "No tenes permiso para ejecutar esta accion.",
            403,
        )


def ensure_visit_queue_access(roles, permissions):
    normalized_roles = {(role or "").strip().upper() for role in roles}
    if ROLE_RECEPCION in normalized_roles:
        return

    state = evaluate_permission_requirement(
        VISIT_QUEUE_PERMISSION_REQUIREMENT,
        permissions,
    )
    if state["granted"]:
        return

    raise VisitDomainError(
        "ROLE_NOT_ALLOWED",
        "No tenes permiso para ejecutar esta accion.",
        403,
    )


def create_visit(
    patient_id,
    arrival_type,
    service_type=Visit.ServiceType.MEDICINA_GENERAL,
    appointment_id=None,
    doctor_id=None,
    notes=None,
):
    if VisitRepository.exists_open_visit_for_patient(patient_id):
        raise VisitDomainError(
            "VISIT_DUPLICATE_SUBMIT",
            "Ya existe una visita abierta para este paciente.",
            409,
        )

    visit = VisitRepository.create(
        patient_id=patient_id,
        arrival_type=arrival_type,
        service_type=service_type,
        appointment_id=appointment_id,
        doctor_id=doctor_id,
        notes=notes,
    )
    return VisitRepository.to_contract(visit)


def list_visits(
    page,
    page_size,
    status_filter=None,
    date_filter=None,
    doctor_id=None,
    service_type=None,
):
    visits, total, total_pages = VisitRepository.list_paginated(
        page=page,
        page_size=page_size,
        status_filter=status_filter,
        date_filter=date_filter,
        doctor_id=doctor_id,
        service_type=service_type,
    )
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
