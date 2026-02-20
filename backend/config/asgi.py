"""
ASGI config for config project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/6.0/howto/deployment/asgi/
"""

import os

from django.core.asgi import get_asgi_application

from infrastructure.realtime.ws_app import visits_websocket_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

django_asgi_application = get_asgi_application()


async def application(scope, receive, send):
    if scope["type"] == "websocket":
        await visits_websocket_application(scope, receive, send)
        return

    await django_asgi_application(scope, receive, send)
