from decimal import Decimal, ROUND_HALF_UP

from django.db import transaction

from apps.authentication.services.authorization_service import has_capability
from apps.somatometria.services.visit_flow_service import (
    VisitFlowError,
    get_visit_flow_service,
)
from apps.somatometria.repositories.vitals_repository import VitalsRepository

SOMATOMETRIA_CAPTURE_CAPABILITY = "flow.somatometria.capture"


def ensure_somatometria_role(roles, permissions=None):
    del roles

    if has_capability(permissions or [], SOMATOMETRIA_CAPTURE_CAPABILITY):
        return

    raise VisitFlowError(
        "ROLE_NOT_ALLOWED",
        "No tenes permiso para ejecutar esta accion.",
        403,
    )


def capture_vitals(visit_id, vitals_payload, *, visit_flow_service=None):
    visit_flow = visit_flow_service or get_visit_flow_service()

    visit = visit_flow.get_by_id(visit_id)
    if not visit:
        raise VisitFlowError(
            "VISIT_NOT_FOUND",
            "Visita no encontrada.",
            404,
        )

    next_state = visit_flow.resolve_next_state(
        visit.status,
        vitals_complete=_has_minimum_vitals(vitals_payload),
    )

    payload = dict(vitals_payload)
    payload["bmi"] = _calculate_bmi(payload["weightKg"], payload["heightCm"])

    with transaction.atomic():
        vital_signs = VitalsRepository.upsert_for_visit(visit, payload)
        visit_flow.update_status(visit, next_state)

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
