from decimal import Decimal, ROUND_HALF_UP

from django.db import transaction
from django.utils import timezone

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

    payload = dict(vitals_payload)
    reused_from_visit_id = payload.pop("reusedFromVisitId", None)
    reused_from = _resolve_reused_source(visit, reused_from_visit_id)

    next_state = visit_flow.resolve_next_state(
        visit.status,
        vitals_complete=_has_minimum_vitals(payload),
    )

    payload["bmi"] = _calculate_bmi(payload["weightKg"], payload["heightCm"])

    with transaction.atomic():
        vital_signs = VitalsRepository.upsert_for_visit(
            visit,
            payload,
            reused_from=reused_from,
        )
        visit_flow.update_status(visit, next_state)

    return {
        "visitId": visit.id_visit,
        "status": next_state,
        "vitals": VitalsRepository.to_contract(vital_signs),
    }


def get_latest_vitals_for_visit(visit_id, *, visit_flow_service=None):
    visit_flow = visit_flow_service or get_visit_flow_service()

    visit = visit_flow.get_by_id(visit_id)
    if not visit:
        raise VisitFlowError(
            "VISIT_NOT_FOUND",
            "Visita no encontrada.",
            404,
        )

    latest = VitalsRepository.get_latest_for_patient(visit.no_exp, visit.pk_num)
    today_capture = VitalsRepository.get_latest_today_for_patient(
        visit.no_exp,
        visit.pk_num,
        exclude_visit_id=visit.id_visit,
    )

    return {
        "vitals": VitalsRepository.latest_to_contract(latest) if latest else None,
        "todayCapture": (
            VitalsRepository.today_to_contract(today_capture)
            if today_capture
            else None
        ),
    }


def _resolve_reused_source(visit, reused_visit_id):
    """
    Valida el reuso de una captura de signos vitales del mismo dia. Las 4
    reglas (mismo orden que los codigos 422 esperados por el spec):
    no reusar la propia visita, el origen debe existir, debe ser la misma
    persona (no_exp+pk_num) y debe haber sido capturado HOY (dia calendario
    local). Devuelve la `Visit` origen (o None si no hay reuso).
    """
    if reused_visit_id is None:
        return None

    if reused_visit_id == visit.id_visit:
        raise VisitFlowError(
            "REUSE_SAME_VISIT",
            "No se puede reusar la captura de esta misma visita.",
            422,
        )

    source = VitalsRepository.get_vitals_by_visit_id(reused_visit_id)
    if source is None:
        raise VisitFlowError(
            "REUSE_SOURCE_NOT_FOUND",
            "La captura de origen no existe.",
            422,
        )

    if source.id_visit.no_exp != visit.no_exp or source.id_visit.pk_num != visit.pk_num:
        raise VisitFlowError(
            "REUSE_PATIENT_MISMATCH",
            "La captura de origen pertenece a otra persona.",
            422,
        )

    if timezone.localtime(source.fch_alta).date() != timezone.localdate():
        raise VisitFlowError(
            "REUSE_NOT_TODAY",
            "Solo se pueden reusar signos vitales tomados hoy.",
            422,
        )

    return source.id_visit


def _has_minimum_vitals(payload):
    return (
        payload.get("temperatureC") is not None
        and payload.get("oxygenSaturationPct") is not None
    )


def _calculate_bmi(weight_kg, height_cm):
    height_m = Decimal(height_cm) / Decimal("100")
    bmi = Decimal(weight_kg) / (height_m * height_m)
    return bmi.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
