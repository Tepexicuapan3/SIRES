from django.test import SimpleTestCase

from apps.consulta_medica.services.realtime_events import build_visit_closed_event
from infrastructure.realtime.contracts import validate_realtime_event_envelope


class ConsultationRealtimeEventContractsTests(SimpleTestCase):
    def test_consultation_event_uses_realtime_envelope_v1(self):
        event = build_visit_closed_event(
            visit_id="VIS-4401",
            sequence=2201,
            request_id="req-consult-1",
            correlation_id="corr-consult-1",
        )

        validate_realtime_event_envelope(event)

        self.assertEqual(event["version"], 1)
        self.assertEqual(event["eventType"], "visit.closed")
        self.assertEqual(event["entity"], "visit")
        self.assertEqual(event["entityId"], "VIS-4401")
        self.assertEqual(event["sequence"], 2201)
