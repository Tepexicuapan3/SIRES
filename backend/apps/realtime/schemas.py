from datetime import datetime, timezone
from uuid import UUID, uuid4

ENVELOPE_VERSION = 1

REQUIRED_EVENT_FIELDS = (
    "eventId",
    "eventType",
    "entity",
    "entityId",
    "version",
    "occurredAt",
    "requestId",
    "correlationId",
    "sequence",
    "payload",
)


def build_realtime_event_envelope(
    *,
    event_type,
    entity,
    entity_id,
    request_id,
    correlation_id,
    sequence,
    payload,
    event_id=None,
    occurred_at=None,
):
    event = {
        "eventId": event_id or str(uuid4()),
        "eventType": event_type,
        "entity": entity,
        "entityId": str(entity_id),
        "version": ENVELOPE_VERSION,
        "occurredAt": occurred_at or _utc_now_iso(),
        "requestId": request_id,
        "correlationId": correlation_id,
        "sequence": sequence,
        "payload": payload,
    }
    validate_realtime_event_envelope(event)
    return event


def validate_realtime_event_envelope(event):
    if not isinstance(event, dict):
        raise ValueError("Realtime event envelope must be a dict.")

    missing_fields = [field for field in REQUIRED_EVENT_FIELDS if field not in event]
    if missing_fields:
        raise ValueError(f"Realtime event envelope missing fields: {missing_fields}")

    _assert_uuid(event["eventId"], "eventId")
    _assert_non_empty_text(event["eventType"], "eventType")
    _assert_non_empty_text(event["entity"], "entity")
    _assert_non_empty_text(event["entityId"], "entityId")

    if event["version"] != ENVELOPE_VERSION:
        raise ValueError("Realtime event envelope version mismatch.")

    if not _is_iso8601_utc(event["occurredAt"]):
        raise ValueError("occurredAt must be ISO8601 UTC.")

    _assert_non_empty_text(event["requestId"], "requestId")
    _assert_non_empty_text(event["correlationId"], "correlationId")

    if not isinstance(event["sequence"], int) or event["sequence"] <= 0:
        raise ValueError("sequence must be a positive integer.")

    if not isinstance(event["payload"], dict):
        raise ValueError("payload must be an object.")


def _assert_uuid(value, field_name):
    if not isinstance(value, str):
        raise ValueError(f"{field_name} must be a UUID string.")

    try:
        UUID(value)
    except ValueError as exc:
        raise ValueError(f"{field_name} must be a UUID string.") from exc


def _assert_non_empty_text(value, field_name):
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"{field_name} must be a non-empty string.")


def _is_iso8601_utc(value):
    if not isinstance(value, str) or not value:
        return False

    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return False

    return parsed.tzinfo is not None


def _utc_now_iso():
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
