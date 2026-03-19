from dataclasses import dataclass

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from apps.realtime.schemas import build_realtime_event_envelope

REALTIME_EVENT_HANDLER = "realtime.event"


@dataclass(frozen=True)
class RealtimePublishMetadata:
    request_id: str
    correlation_id: str
    sequence: int


class RealtimePublisher:
    def __init__(self, channel_layer=None):
        self._channel_layer = channel_layer or get_channel_layer()

    def build_event(
        self,
        *,
        event_type,
        entity,
        entity_id,
        metadata,
        payload=None,
    ):
        safe_payload = payload if isinstance(payload, dict) else {}
        return build_realtime_event_envelope(
            event_type=event_type,
            entity=entity,
            entity_id=entity_id,
            sequence=metadata.sequence,
            request_id=metadata.request_id,
            correlation_id=metadata.correlation_id,
            payload=safe_payload,
        )

    def publish(
        self,
        *,
        group_names,
        event_type,
        entity,
        entity_id,
        metadata,
        payload=None,
    ):
        if not group_names:
            raise ValueError("group_names must include at least one group.")

        if self._channel_layer is None:
            raise RuntimeError("Channel layer is not configured.")

        event = self.build_event(
            event_type=event_type,
            entity=entity,
            entity_id=entity_id,
            metadata=metadata,
            payload=payload,
        )

        for group_name in group_names:
            async_to_sync(self._channel_layer.group_send)(
                group_name,
                {
                    "type": REALTIME_EVENT_HANDLER,
                    "event": event,
                },
            )

        return event
