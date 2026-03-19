from django.test import TestCase

from apps.realtime.events import publish_visit_status_changed
from apps.realtime.models import RealtimeSequence


class _InMemoryPublisher:
    def __init__(self):
        self.published = []

    def publish(self, **kwargs):
        self.published.append(kwargs)
        return {
            "sequence": kwargs["metadata"].sequence,
            "eventType": kwargs["event_type"],
        }


class RealtimeSequenceGenerationTests(TestCase):
    def test_sequence_increments_persisted_counter(self):
        publisher = _InMemoryPublisher()

        first = publish_visit_status_changed(
            visit_id=1001,
            status="en_espera",
            request_id="req-seq-1",
            correlation_id="corr-seq-1",
            publisher=publisher,
        )
        second = publish_visit_status_changed(
            visit_id=1002,
            status="en_somatometria",
            request_id="req-seq-2",
            correlation_id="corr-seq-2",
            publisher=publisher,
        )

        self.assertEqual(second["sequence"], first["sequence"] + 1)

        sequence_row = RealtimeSequence.objects.get(stream_key="visits.stream")
        self.assertEqual(sequence_row.last_sequence, second["sequence"])

    def test_sequence_store_initializes_when_missing(self):
        self.assertFalse(RealtimeSequence.objects.filter(stream_key="visits.stream").exists())

        publisher = _InMemoryPublisher()
        event = publish_visit_status_changed(
            visit_id=1003,
            status="lista_para_doctor",
            request_id="req-seq-3",
            correlation_id="corr-seq-3",
            publisher=publisher,
        )

        self.assertGreater(event["sequence"], 0)
        self.assertTrue(RealtimeSequence.objects.filter(stream_key="visits.stream").exists())
