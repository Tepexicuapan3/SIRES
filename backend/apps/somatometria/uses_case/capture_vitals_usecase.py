from decimal import Decimal, ROUND_HALF_UP

from apps.authentication.services.permission_dependencies import (
    evaluate_permission_requirement,
)
from apps.recepcion.repositories.visit_repository import VisitRepository
from apps.recepcion.services.errors import VisitDomainError
from apps.recepcion.uses_case.visit_state_machine_usecase import (
    ROLE_SOMATOMETRIA,
    transition_visit_state,
)
from apps.somatometria.repositories.vitals_repository import VitalsRepository

SOMATOMETRIA_CAPTURE_PERMISSION_REQUIREMENT = {
    "allOf": ["clinico:somatometria:read"]
}


def ensure_somatometria_role(roles, permissions=None):
    normalized_roles = {(role or "").strip().upper() for role in roles}
    if ROLE_SOMATOMETRIA in normalized_roles:
        return

    permission_state = evaluate_permission_requirement(
        SOMATOMETRIA_CAPTURE_PERMISSION_REQUIREMENT,
        permissions or [],
    )
    if permission_state["granted"]:
        return

    raise VisitDomainError(
        "ROLE_NOT_ALLOWED",
        "No tenes permiso para ejecutar esta accion.",
        403,
    )


def capture_vitals(visit_id, vitals_payload):
    visit = VisitRepository.get_by_id(visit_id)
    if not visit:
        raise VisitDomainError(
            "VISIT_NOT_FOUND",
            "Visita no encontrada.",
            404,
        )

    next_state = transition_visit_state(
        visit.status,
        "lista_para_doctor",
        ROLE_SOMATOMETRIA,
        vitals_complete=_has_minimum_vitals(vitals_payload),
    )

    payload = dict(vitals_payload)
    payload["bmi"] = _calculate_bmi(payload["weightKg"], payload["heightCm"])

    vital_signs = VitalsRepository.upsert_for_visit(visit, payload)
    VisitRepository.update_status(visit, next_state)

    return {
        "visitId": visit.id_visit,
        "status": next_state,
        "vitals": VitalsRepository.to_contract(vital_signs),
    }


def _has_minimum_vitals(payload):
    return (
        payload.get("temperatureC") is not None
        and payload.get("oxygenSaturationPct") is not None
    )


def _calculate_bmi(weight_kg, height_cm):
    height_m = Decimal(height_cm) / Decimal("100")
    bmi = Decimal(weight_kg) / (height_m * height_m)
    return bmi.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
