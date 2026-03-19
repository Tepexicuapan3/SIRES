from channels.routing import URLRouter

from apps.realtime.routing import WS_VISITS_STREAM_PATH, websocket_urlpatterns

visits_websocket_application = URLRouter(websocket_urlpatterns)

__all__ = [
    "WS_VISITS_STREAM_PATH",
    "visits_websocket_application",
]
