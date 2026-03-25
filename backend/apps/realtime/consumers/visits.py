from apps.authentication.services.authorization_service import has_capability
from apps.realtime.consumers.base import BaseRealtimeConsumer

VISITS_STREAM_GROUP = "visits.stream"
VISITS_STREAM_READ_CAPABILITY = "flow.visits.queue.read"


class VisitsRealtimeConsumer(BaseRealtimeConsumer):
    def get_group_names(self):
        return [VISITS_STREAM_GROUP]

    def authorize_scope(self, realtime_user):
        permissions = {
            (permission or "").strip()
            for permission in (realtime_user or {}).get("permissions", [])
        }
        return has_capability(list(permissions), VISITS_STREAM_READ_CAPABILITY)
