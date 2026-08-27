from django.db import transaction

from apps.somatometria.services.bmi_service import calculate_bmi
from apps.somatometria.services.visit_flow_service import (
    VisitFlowError,
    get_visit_flow_service,
)
from apps.somatometria.repositories.vitals_repository import VitalsRepository


def edit_vitals(visit_id, vitals_payload, *, actor, audit_hook, visit_flow_service=None):
    """
    Edicion auditada de signos vitales YA capturados (D10, Fase 3 del
    change `somatometria-modulo-integral`). HTTP-free a proposito: no
    recibe `request`, solo un `audit_hook` inyectado por la vista. La
    vista arma ese hook llamando a `log_event(..., raise_on_error=True)`
    -- si la escritura de auditoria falla, el hook relanza la excepcion y
    TODO el `transaction.atomic()` de aca abajo se revierte. La correccion
    NUNCA debe persistir sin su evento de auditoria correspondiente (spec
    `somatometria/edicion-auditada`).

    NUNCA cambia `status` de la visita ni emite `visit_status_changed`
    (D8): esto corrige la MISMA fila, no repite el flujo de captura.
    """
    visit_flow = visit_flow_service or get_visit_flow_service()

    visit = visit_flow.get_by_id(visit_id)
    if not visit:
        raise VisitFlowError("VISIT_NOT_FOUND", "Visita no encontrada.", 404)

    vital_signs = VitalsRepository.get_vitals_by_visit_id(visit_id)
    if vital_signs is None:
        raise VisitFlowError(
            "VITALS_NOT_FOUND",
            "Esta visita no tiene signos vitales capturados que corregir.",
            404,
        )

    payload = dict(vitals_payload)
    payload["bmi"] = calculate_bmi(payload["weightKg"], payload["heightCm"])

    # Snapshot ANTES de tocar la fila -- `_metrics_contract` ya castea a
    # float/int, JSON-safe para guardar en `AuditoriaEvento.datos_antes`.
    datos_antes = VitalsRepository._metrics_contract(vital_signs)

    with transaction.atomic():
        vital_signs = VitalsRepository.update_for_visit(
            vital_signs,
            payload,
            updated_by=actor,
        )
        datos_despues = VitalsRepository._metrics_contract(vital_signs)

        # Si esto lanza (auditoria estricta, `raise_on_error=True`), el
        # `update_for_visit` de arriba se revierte junto con todo lo demas
        # dentro de este `atomic()` -- la correccion NO queda a medias.
        audit_hook(
            vitals_id=vital_signs.id_vitals,
            datos_antes=datos_antes,
            datos_despues=datos_despues,
        )

    return {
        "visitId": visit.id_visit,
        "vitals": VitalsRepository.to_contract(vital_signs),
    }
