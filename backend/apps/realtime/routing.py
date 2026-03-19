from django.urls import path

from apps.realtime.consumers.visits import VisitsRealtimeConsumer

WS_VISITS_STREAM_ROUTE = "ws/v1/visits/stream"
WS_VISITS_STREAM_PATH = f"/{WS_VISITS_STREAM_ROUTE}"

websocket_urlpatterns = [
    path(WS_VISITS_STREAM_ROUTE, VisitsRealtimeConsumer.as_asgi()),
]
