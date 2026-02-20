from django.test import SimpleTestCase

from apps.realtime.publisher import (
    REALTIME_EVENT_HANDLER,
    RealtimePublishMetadata,
    RealtimePublisher,
)


class _FakeChannelLayer:
    def __init__(self):
        self.messages = []

    async def group_send(self, group, message):
        self.messages.append((group, message))


class RealtimePublisherTests(SimpleTestCase):
    def test_publish_creates_consistent_envelope_and_sends_to_groups(self):
        channel_layer = _FakeChannelLayer()
        publisher = RealtimePublisher(channel_layer=channel_layer)
        metadata = RealtimePublishMetadata(
            request_id="req-7101",
            correlation_id="corr-7101",
            sequence=7101,
        )

        event = publisher.publish(
            group_names=["visits.stream", "clinic.10"],
            event_type="visit.status.changed",
            entity="visit",
            entity_id="VIS-7101",
            metadata=metadata,
            payload={"status": "en_consulta"},
        )

        self.assertEqual(event["requestId"], "req-7101")
        self.assertEqual(event["correlationId"], "corr-7101")
        self.assertEqual(event["sequence"], 7101)
        self.assertEqual(len(channel_layer.messages), 2)
        self.assertEqual(channel_layer.messages[0][0], "visits.stream")
        self.assertEqual(channel_layer.messages[0][1]["type"], REALTIME_EVENT_HANDLER)
        self.assertEqual(channel_layer.messages[0][1]["event"]["eventType"], "visit.status.changed")

    def test_publish_handles_partial_payload_without_breaking(self):
        channel_layer = _FakeChannelLayer()
        publisher = RealtimePublisher(channel_layer=channel_layer)
        metadata = RealtimePublishMetadata(
            request_id="req-7201",
            correlation_id="corr-7201",
            sequence=7201,
        )

        event = publisher.publish(
            group_names=["visits.stream"],
            event_type="visit.closed",
            entity="visit",
            entity_id="VIS-7201",
            metadata=metadata,
            payload=None,
        )

        self.assertEqual(event["payload"], {})

    def test_publish_requires_at_least_one_group(self):
        channel_layer = _FakeChannelLayer()
        publisher = RealtimePublisher(channel_layer=channel_layer)
        metadata = RealtimePublishMetadata(
            request_id="req-7301",
            correlation_id="corr-7301",
            sequence=7301,
        )

        with self.assertRaisesMessage(ValueError, "at least one group"):
            publisher.publish(
                group_names=[],
                event_type="visit.status.changed",
                entity="visit",
                entity_id="VIS-7301",
                metadata=metadata,
                payload={"status": "en_espera"},
            )
