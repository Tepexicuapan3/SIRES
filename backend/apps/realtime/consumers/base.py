from channels.generic.websocket import AsyncJsonWebsocketConsumer

from apps.realtime.auth import REALTIME_QUERY_TOKEN_SCOPE_KEY, REALTIME_USER_SCOPE_KEY

WS_CLOSE_UNAUTHORIZED = 4401


class BaseRealtimeConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        if self.scope.get(REALTIME_QUERY_TOKEN_SCOPE_KEY):
            await self.close(code=WS_CLOSE_UNAUTHORIZED)
            return

        user = self.scope.get(REALTIME_USER_SCOPE_KEY)
        if user is None:
            await self.close(code=WS_CLOSE_UNAUTHORIZED)
            return

        self._joined_groups = []
        for group_name in self.get_group_names():
            await self.channel_layer.group_add(group_name, self.channel_name)
            self._joined_groups.append(group_name)

        await self.accept()

    async def disconnect(self, close_code):
        joined_groups = getattr(self, "_joined_groups", [])
        for group_name in joined_groups:
            await self.channel_layer.group_discard(group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        if content.get("type") == "ping":
            await self.send_json({"type": "pong"})

    async def realtime_event(self, event):
        payload = event.get("event", {})
        await self.send_json(payload)

    def get_group_names(self):
        return []
