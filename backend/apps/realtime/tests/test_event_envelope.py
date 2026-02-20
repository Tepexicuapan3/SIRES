from django.test import SimpleTestCase

from apps.realtime.schemas import (
    ENVELOPE_VERSION,
    REQUIRED_EVENT_FIELDS,
    build_realtime_event_envelope,
    validate_realtime_event_envelope,
)


class RealtimeEventEnvelopeTests(SimpleTestCase):
    def test_envelope_includes_required_v1_fields_with_expected_types(self):
        event = build_realtime_event_envelope(
            event_type="visit.status.changed",
            entity="visit",
            entity_id="VIS-5001",
            request_id="req-5001",
            correlation_id="corr-5001",
            sequence=501,
            payload={"status": "en_consulta"},
        )

        self.assertEqual(set(REQUIRED_EVENT_FIELDS), set(event.keys()))
        self.assertEqual(event["version"], ENVELOPE_VERSION)
        self.assertIsInstance(event["eventId"], str)
        self.assertIsInstance(event["eventType"], str)
        self.assertIsInstance(event["entity"], str)
        self.assertIsInstance(event["entityId"], str)
        self.assertIsInstance(event["occurredAt"], str)
        self.assertIsInstance(event["requestId"], str)
        self.assertIsInstance(event["correlationId"], str)
        self.assertIsInstance(event["sequence"], int)
        self.assertIsInstance(event["payload"], dict)

        validate_realtime_event_envelope(event)

    def test_envelope_propagates_request_and_correlation_ids(self):
        event = build_realtime_event_envelope(
            event_type="visit.closed",
            entity="visit",
            entity_id="VIS-5002",
            request_id="req-propagated",
            correlation_id="corr-propagated",
            sequence=777,
            payload={},
        )

        self.assertEqual(event["requestId"], "req-propagated")
        self.assertEqual(event["correlationId"], "corr-propagated")
        self.assertEqual(event["version"], ENVELOPE_VERSION)

    def test_envelope_validation_rejects_invalid_version(self):
        event = build_realtime_event_envelope(
            event_type="visit.status.changed",
            entity="visit",
            entity_id="VIS-5003",
            request_id="req-5003",
            correlation_id="corr-5003",
            sequence=900,
            payload={"status": "cerrada"},
        )
        event["version"] = 99

        with self.assertRaisesMessage(ValueError, "version mismatch"):
            validate_realtime_event_envelope(event)
