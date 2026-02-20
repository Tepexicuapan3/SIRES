from apps.realtime.consumers.base import BaseRealtimeConsumer

VISITS_STREAM_GROUP = "visits.stream"


class VisitsRealtimeConsumer(BaseRealtimeConsumer):
    def get_group_names(self):
        return [VISITS_STREAM_GROUP]
