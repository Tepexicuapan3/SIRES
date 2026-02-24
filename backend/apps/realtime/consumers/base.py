import logging

from channels.generic.websocket import AsyncJsonWebsocketConsumer

from apps.realtime.auth import REALTIME_QUERY_TOKEN_SCOPE_KEY, REALTIME_USER_SCOPE_KEY

WS_CLOSE_UNAUTHORIZED = 4401
WS_CLOSE_BAD_PAYLOAD = 4400
HEARTBEAT_PING_TYPE = "ping"
HEARTBEAT_PONG_TYPE = "pong"

logger = logging.getLogger(__name__)


class BaseRealtimeConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        if self.scope.get(REALTIME_QUERY_TOKEN_SCOPE_KEY):
            logger.warning(
                "WS handshake rejected: token in query string",
                extra={"path": self.scope.get("path")},
            )
            await self.close(code=WS_CLOSE_UNAUTHORIZED)
            return

        user = self.scope.get(REALTIME_USER_SCOPE_KEY)
        if user is None:
            logger.warning(
                "WS handshake rejected: missing realtime auth user",
                extra={"path": self.scope.get("path")},
            )
            await self.close(code=WS_CLOSE_UNAUTHORIZED)
            return

        self._joined_groups = []
        for group_name in self.get_group_names():
            await self.channel_layer.group_add(group_name, self.channel_name)
            self._joined_groups.append(group_name)

        await self.accept()

    async def disconnect(self, code):
        joined_groups = getattr(self, "_joined_groups", [])
        for group_name in joined_groups:
            await self.channel_layer.group_discard(group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        if not isinstance(content, dict):
            await self.close(code=WS_CLOSE_BAD_PAYLOAD)
            return

        if content.get("type") == HEARTBEAT_PING_TYPE:
            await self.send_json({"type": HEARTBEAT_PONG_TYPE})

    async def realtime_event(self, event):
        payload = event.get("event", {})
        await self.send_json(payload)

    def get_group_names(self):
        return []
