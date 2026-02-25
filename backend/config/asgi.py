import os
from typing import Any, cast

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

from django.core.asgi import get_asgi_application
from django.conf import settings

django_asgi_application = get_asgi_application()

from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator, OriginValidator

from apps.realtime.auth import CookieJWTAuthMiddleware
from apps.realtime.routing import websocket_urlpatterns


def build_websocket_origin_validator(websocket_application):
    if getattr(settings, "WS_ALLOW_ALL_ORIGINS", False):
        return OriginValidator(websocket_application, ["*"])

    if getattr(settings, "DEBUG", False) and getattr(
        settings, "ALLOW_ALL_HOSTS", False
    ):
        return OriginValidator(websocket_application, ["*"])

    allowed_origins = getattr(settings, "WS_ALLOWED_ORIGINS", [])
    if allowed_origins:
        return OriginValidator(websocket_application, allowed_origins)

    return AllowedHostsOriginValidator(websocket_application)


websocket_application = CookieJWTAuthMiddleware(
    URLRouter(cast(list[Any], websocket_urlpatterns)),  # type: ignore[arg-type]
)


def build_application():
    return ProtocolTypeRouter(
        {
            "http": django_asgi_application,
            "websocket": build_websocket_origin_validator(websocket_application),
        }
    )


application = build_application()
