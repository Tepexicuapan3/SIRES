from django.db import transaction

from apps.consulta_medica.repositories.consultation_repository import ConsultationRepository
from apps.recepcion.repositories.visit_repository import VisitRepository
from apps.recepcion.services.errors import VisitDomainError
from apps.recepcion.uses_case.visit_state_machine_usecase import (
    ROLE_DOCTOR,
    transition_visit_state,
)

def ensure_doctor_role(roles):
    normalized_roles = {(role or "").strip().upper() for role in roles}
    if ROLE_DOCTOR not in normalized_roles:
        raise VisitDomainError(
            "ROLE_NOT_ALLOWED",
            "No tenes permiso para ejecutar esta accion.",
            403,
        )


def _get_visit_or_error(visit_id):
    visit = VisitRepository.get_by_id(visit_id)
    if not visit:
        raise VisitDomainError(
            "VISIT_NOT_FOUND",
            "Visita no encontrada.",
            404,
        )
    return visit


def start_consultation(visit_id, roles):
    ensure_doctor_role(roles)
    visit = _get_visit_or_error(visit_id)

    next_state = transition_visit_state(
        current_state=visit.status,
        target_state="en_consulta",
        actor_role=ROLE_DOCTOR,
    )
    visit = VisitRepository.update_status(visit, next_state)
    return VisitRepository.to_contract(visit)


def close_consultation(
    visit_id,
    roles,
    primary_diagnosis,
    final_note,
    doctor_id,
):
    ensure_doctor_role(roles)
    normalized_primary_diagnosis = (primary_diagnosis or "").strip()
    normalized_final_note = (final_note or "").strip()

    visit = _get_visit_or_error(visit_id)

    next_state = transition_visit_state(
        current_state=visit.status,
        target_state="cerrada",
        actor_role=ROLE_DOCTOR,
        primary_diagnosis=normalized_primary_diagnosis,
        final_note=normalized_final_note,
    )

    with transaction.atomic():
        consultation, _ = ConsultationRepository.upsert_for_visit(
            visit,
            doctor_id=doctor_id,
            primary_diagnosis=normalized_primary_diagnosis,
            final_note=normalized_final_note,
            created_by_id=doctor_id,
            updated_by_id=doctor_id,
        )
        visit = VisitRepository.update_status(visit, next_state)

    return {
        "visit": VisitRepository.to_contract(visit),
        "consultation": ConsultationRepository.to_contract(consultation),
    }

