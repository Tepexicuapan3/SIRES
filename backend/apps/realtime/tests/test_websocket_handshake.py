import asyncio
import json

from asgiref.testing import ApplicationCommunicator
from django.contrib.auth.hashers import make_password
from django.test import TestCase, override_settings

from apps.authentication.models import SyUsuario
from apps.authentication.services.token_service import (
    ACCESS_COOKIE,
    create_access_refresh_tokens,
)
from apps.realtime.routing import WS_VISITS_STREAM_PATH
from config.asgi import build_application


@override_settings(
    ALLOWED_HOSTS=["localhost", "testserver"],
    WS_ALLOW_ALL_ORIGINS=False,
    WS_ALLOWED_ORIGINS=[],
)
class RealtimeHandshakeSecurityTests(TestCase):
    def setUp(self):
        self.user = SyUsuario.objects.create(
            usuario="ws_realtime_user",
            correo="ws_realtime_user@example.com",
            clave_hash=make_password("Secret123!"),
            est_activo=True,
            cambiar_clave=False,
            terminos_acept=True,
        )
        access_token, _ = create_access_refresh_tokens(self.user)
        self.cookie_header = f"{ACCESS_COOKIE}={access_token}".encode()

    def test_connection_accepts_valid_cookie_auth(self):
        response = self._connect_once(
            headers=[
                (b"origin", b"http://localhost:5173"),
                (b"cookie", self.cookie_header),
            ],
            query_string=b"",
        )

        self.assertEqual(response["type"], "websocket.accept")

    def test_connection_rejects_missing_auth_cookie(self):
        response = self._connect_once(
            headers=[(b"origin", b"http://localhost:5173")],
            query_string=b"",
        )

        self.assertEqual(response["type"], "websocket.close")
        self.assertEqual(response.get("code"), 4401)

    def test_connection_rejects_not_allowed_origin(self):
        response = self._connect_once(
            headers=[
                (b"origin", b"http://evil.example"),
                (b"cookie", self.cookie_header),
            ],
            query_string=b"",
        )

        self.assertEqual(response["type"], "websocket.close")

    def test_connection_rejects_token_in_query_string(self):
        response = self._connect_once(
            headers=[
                (b"origin", b"http://localhost:5173"),
                (b"cookie", self.cookie_header),
            ],
            query_string=b"access_token=forbidden-token",
        )

        self.assertEqual(response["type"], "websocket.close")
        self.assertEqual(response.get("code"), 4401)

    def test_connection_supports_ping_pong_liveness(self):
        response = self._run_interaction(
            headers=[
                (b"origin", b"http://localhost:5173"),
                (b"cookie", self.cookie_header),
            ],
            query_string=b"",
            message={"type": "ping"},
        )

        self.assertEqual(response.get("type"), "websocket.send")
        payload = json.loads(response.get("text", "{}"))
        self.assertEqual(payload.get("type"), "pong")

    def test_connection_rejects_non_object_ws_payload(self):
        response = self._run_interaction(
            headers=[
                (b"origin", b"http://localhost:5173"),
                (b"cookie", self.cookie_header),
            ],
            query_string=b"",
            message="invalid-payload",
        )

        self.assertEqual(response.get("type"), "websocket.close")
        self.assertEqual(response.get("code"), 4400)

    def _connect_once(self, *, headers, query_string):
        response = self._run_interaction(
            headers=headers,
            query_string=query_string,
            message=None,
        )
        return response["connect_output"]

    def _run_interaction(self, *, headers, query_string, message):
        async def run_connect():
            application = build_application()
            communicator = ApplicationCommunicator(
                application,
                {
                    "type": "websocket",
                    "path": WS_VISITS_STREAM_PATH,
                    "headers": headers,
                    "query_string": query_string,
                    "subprotocols": [],
                },
            )

            await communicator.send_input({"type": "websocket.connect"})
            connect_output = await communicator.receive_output(timeout=1)

            message_output = None
            if connect_output.get("type") == "websocket.accept" and message is not None:
                await communicator.send_input(
                    {
                        "type": "websocket.receive",
                        "text": json.dumps(message),
                    }
                )
                message_output = await communicator.receive_output(timeout=1)

            if connect_output.get("type") == "websocket.accept":
                await communicator.send_input({"type": "websocket.disconnect", "code": 1000})

            await communicator.wait()
            return {
                "connect_output": connect_output,
                "message_output": message_output,
            }

        output = asyncio.run(run_connect())
        return output if message is None else output["message_output"]
