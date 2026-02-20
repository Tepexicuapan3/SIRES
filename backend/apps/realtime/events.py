from itertools import count
from time import time_ns
from uuid import uuid4

from apps.realtime.consumers.visits import VISITS_STREAM_GROUP
from apps.realtime.publisher import RealtimePublishMetadata, RealtimePublisher

_SEQUENCE_GENERATOR = count(start=max(1, time_ns() // 1_000_000), step=1)


def _build_metadata(*, request_id, correlation_id):
    normalized_request_id = (request_id or "").strip() or str(uuid4())
    normalized_correlation_id = (correlation_id or "").strip() or normalized_request_id

    return RealtimePublishMetadata(
        request_id=normalized_request_id,
        correlation_id=normalized_correlation_id,
        sequence=next(_SEQUENCE_GENERATOR),
    )


def publish_visit_status_changed(
    *,
    visit_id,
    status,
    request_id,
    correlation_id=None,
    publisher=None,
):
    realtime_publisher = publisher or RealtimePublisher()
    metadata = _build_metadata(request_id=request_id, correlation_id=correlation_id)

    return realtime_publisher.publish(
        group_names=[VISITS_STREAM_GROUP],
        event_type="visit.status.changed",
        entity="visit",
        entity_id=visit_id,
        metadata=metadata,
        payload={
            "status": status,
        },
    )


def publish_visit_closed(
    *,
    visit_id,
    request_id,
    correlation_id=None,
    publisher=None,
):
    realtime_publisher = publisher or RealtimePublisher()
    metadata = _build_metadata(request_id=request_id, correlation_id=correlation_id)

    return realtime_publisher.publish(
        group_names=[VISITS_STREAM_GROUP],
        event_type="visit.closed",
        entity="visit",
        entity_id=visit_id,
        metadata=metadata,
        payload={},
    )
