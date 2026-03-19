from django.db import transaction

from apps.authentication.services.permission_dependencies import (
    evaluate_permission_requirement,
)
from apps.consulta_medica.repositories.cies_repository import CiesRepository
from apps.consulta_medica.repositories.consultation_repository import ConsultationRepository
from apps.consulta_medica.repositories.prescription_repository import PrescriptionRepository
from apps.recepcion.repositories.visit_repository import VisitRepository
from apps.recepcion.services.errors import VisitDomainError
from apps.recepcion.uses_case.visit_state_machine_usecase import (
    ROLE_DOCTOR,
    transition_visit_state,
)

DOCTOR_CONSULTATION_PERMISSION_REQUIREMENT = {
    "allOf": ["clinico:consultas:read"]
}

CIE_SEARCH_MIN_LENGTH = 2


def ensure_doctor_role(roles, permissions=None):
    normalized_roles = {(role or "").strip().upper() for role in roles}
    if ROLE_DOCTOR in normalized_roles:
        return

    permission_state = evaluate_permission_requirement(
        DOCTOR_CONSULTATION_PERMISSION_REQUIREMENT,
        permissions or [],
    )
    if permission_state["granted"]:
        return

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


def _ensure_visit_in_consultation(visit):
    if visit.status != "en_consulta":
        raise VisitDomainError(
            "VISIT_STATE_INVALID",
            "La visita debe estar en consulta para ejecutar esta accion.",
            409,
        )


def _normalize_prescription_items(items):
    normalized_items = []
    for item in items or []:
        normalized_item = (item or "").strip()
        if normalized_item:
            normalized_items.append(normalized_item)
    return normalized_items


def _normalize_cie_code(cie_code):
    normalized = (cie_code or "").strip().upper()
    return normalized or None


def _resolve_cie_code_or_error(cie_code):
    normalized_code = _normalize_cie_code(cie_code)
    if not normalized_code:
        return None

    cie_match = CiesRepository.get_active_by_code(normalized_code)
    if cie_match is None:
        raise VisitDomainError(
            "VALIDATION_ERROR",
            "Hay errores en el formulario",
            422,
            details={"cieCode": ["La clave CIE no existe o no esta activa."]},
        )

    return normalized_code


def start_consultation(visit_id, roles, permissions=None):
    ensure_doctor_role(roles, permissions)
    visit = _get_visit_or_error(visit_id)

    next_state = transition_visit_state(
        current_state=visit.status,
        target_state="en_consulta",
        actor_role=ROLE_DOCTOR,
    )
    visit = VisitRepository.update_status(visit, next_state)
    return VisitRepository.to_contract(visit)


def save_diagnosis(
    visit_id,
    roles,
    primary_diagnosis,
    final_note,
    doctor_id,
    permissions=None,
    cie_code=None,
):
    ensure_doctor_role(roles, permissions)

    visit = _get_visit_or_error(visit_id)
    _ensure_visit_in_consultation(visit)

    normalized_primary_diagnosis = (primary_diagnosis or "").strip()
    normalized_final_note = (final_note or "").strip()
    normalized_cie_code = _resolve_cie_code_or_error(cie_code)
    if not normalized_primary_diagnosis or not normalized_final_note:
        raise VisitDomainError(
            "VISIT_STATE_INVALID",
            "No se puede guardar diagnostico: falta diagnostico o nota final.",
            409,
        )

    with transaction.atomic():
        consultation, _ = ConsultationRepository.upsert_for_visit(
            visit,
            doctor_id=doctor_id,
            primary_diagnosis=normalized_primary_diagnosis,
            cie_code=normalized_cie_code,
            final_note=normalized_final_note,
            created_by_id=doctor_id,
            updated_by_id=doctor_id,
        )

    return {
        "visitId": visit.id_visit,
        "status": visit.status,
        "primaryDiagnosis": consultation.primary_diagnosis,
        "cieCode": consultation.cie_code,
        "finalNote": consultation.final_note,
    }


def save_prescriptions(
    visit_id,
    roles,
    items,
    doctor_id,
    permissions=None,
):
    ensure_doctor_role(roles, permissions)

    visit = _get_visit_or_error(visit_id)
    _ensure_visit_in_consultation(visit)

    normalized_items = _normalize_prescription_items(items)
    if not normalized_items:
        raise VisitDomainError(
            "VALIDATION_ERROR",
            "Hay errores en el formulario",
            422,
            details={"items": ["Debes indicar al menos una receta."]},
        )

    with transaction.atomic():
        prescription, _ = PrescriptionRepository.upsert_for_visit(
            visit,
            items=normalized_items,
            created_by_id=doctor_id,
            updated_by_id=doctor_id,
        )

    return {
        "visitId": visit.id_visit,
        "status": visit.status,
        "items": list(prescription.items or []),
    }


def close_consultation(
    visit_id,
    roles,
    primary_diagnosis,
    final_note,
    doctor_id,
    permissions=None,
    cie_code=None,
):
    ensure_doctor_role(roles, permissions)
    normalized_primary_diagnosis = (primary_diagnosis or "").strip()
    normalized_final_note = (final_note or "").strip()
    normalized_cie_code = _resolve_cie_code_or_error(cie_code)

    visit = _get_visit_or_error(visit_id)

    if visit.status == "cerrada":
        existing_consultation = ConsultationRepository.get_by_visit(visit)
        if (
            existing_consultation is not None
            and existing_consultation.primary_diagnosis == normalized_primary_diagnosis
            and existing_consultation.cie_code == normalized_cie_code
            and existing_consultation.final_note == normalized_final_note
        ):
            return {
                "visit": VisitRepository.to_contract(visit),
                "consultation": ConsultationRepository.to_contract(existing_consultation),
            }

        if existing_consultation is not None:
            raise VisitDomainError(
                "CONFLICT_DUPLICATE_ACTION",
                "La consulta ya fue cerrada con datos diferentes.",
                409,
            )

        with transaction.atomic():
            consultation, _ = ConsultationRepository.upsert_for_visit(
                visit,
                doctor_id=doctor_id,
                primary_diagnosis=normalized_primary_diagnosis,
                cie_code=normalized_cie_code,
                final_note=normalized_final_note,
                created_by_id=doctor_id,
                updated_by_id=doctor_id,
            )

        return {
            "visit": VisitRepository.to_contract(visit),
            "consultation": ConsultationRepository.to_contract(consultation),
        }

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
            cie_code=normalized_cie_code,
            final_note=normalized_final_note,
            created_by_id=doctor_id,
            updated_by_id=doctor_id,
        )
        visit = VisitRepository.update_status(visit, next_state)

    return {
        "visit": VisitRepository.to_contract(visit),
        "consultation": ConsultationRepository.to_contract(consultation),
    }


def search_cies(search, roles, permissions=None, *, limit=10):
    ensure_doctor_role(roles, permissions)

    normalized_search = (search or "").strip()
    if len(normalized_search) < CIE_SEARCH_MIN_LENGTH:
        raise VisitDomainError(
            "VALIDATION_ERROR",
            "Hay errores en el formulario",
            422,
            details={
                "search": [
                    "Debes ingresar al menos 2 caracteres para buscar CIE.",
                ]
            },
        )

    results = CiesRepository.search_active(normalized_search, limit=limit)
    return {
        "items": [
            {
                "code": item.code,
                "description": item.description,
                "version": item.version,
            }
            for item in results
        ],
        "total": len(results),
    }
