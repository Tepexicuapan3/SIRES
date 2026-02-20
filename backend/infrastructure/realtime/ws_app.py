from urllib.parse import urlparse

from django.conf import settings

from infrastructure.realtime.auth import authenticate_websocket_scope, extract_header

WS_VISITS_STREAM_PATH = "/ws/v1/visits/stream"


class VisitsWebSocketApplication:
    async def __call__(self, scope, receive, send):
        if scope.get("path") != WS_VISITS_STREAM_PATH:
            await _close(send, 4404)
            return

        if not _is_allowed_origin(scope):
            await _close(send, 4403)
            return

        user = await authenticate_websocket_scope(scope)
        if user is None:
            await _close(send, 4401)
            return

        await send({"type": "websocket.accept"})

        while True:
            message = await receive()
            message_type = message.get("type")

            if message_type == "websocket.disconnect":
                return

            if message_type == "websocket.receive":
                if message.get("text") == "ping":
                    await send({"type": "websocket.send", "text": "pong"})


def _is_allowed_origin(scope):
    origin = extract_header(scope, b"origin")
    if not origin:
        return False

    parsed_origin = urlparse(origin)
    origin_host = parsed_origin.hostname
    if not origin_host:
        return False

    allowed_hosts = set(settings.ALLOWED_HOSTS)
    if "*" in allowed_hosts:
        return True

    return origin_host in allowed_hosts


async def _close(send, code):
    await send({"type": "websocket.close", "code": code})


visits_websocket_application = VisitsWebSocketApplication()
