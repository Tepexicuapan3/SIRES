from infrastructure.realtime.contracts import build_realtime_event_envelope


def build_visit_status_changed_event(
    *,
    visit_id,
    status,
    sequence,
    request_id,
    correlation_id,
):
    return build_realtime_event_envelope(
        event_type="visit.status.changed",
        entity="visit",
        entity_id=visit_id,
        sequence=sequence,
        request_id=request_id,
        correlation_id=correlation_id,
        payload={
            "status": status,
        },
    )
