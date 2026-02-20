import asyncio

from asgiref.testing import ApplicationCommunicator
from django.contrib.auth.hashers import make_password
from django.test import TestCase, override_settings

from apps.authentication.models import SyUsuario
from apps.authentication.services.token_service import ACCESS_COOKIE, create_access_refresh_tokens
from apps.consulta_medica.services.realtime_events import (
    build_visit_closed_event,
)
from apps.recepcion.services.realtime_events import (
    build_visit_status_changed_event,
)
from config.asgi import application
from infrastructure.realtime.contracts import (
    validate_realtime_event_envelope,
)
from infrastructure.realtime.ordering import evaluate_sequence_progression
from infrastructure.realtime.ws_app import WS_VISITS_STREAM_PATH


@override_settings(ALLOWED_HOSTS=["localhost", "testserver"])
class VisitWebSocketContractsTests(TestCase):
    def setUp(self):
        self.user = SyUsuario.objects.create(
            usuario="ws_user",
            correo="ws_user@example.com",
            clave_hash=make_password("Secret123!"),
            est_activo=True,
            cambiar_clave=False,
            terminos_acept=True,
        )
        access_token, _ = create_access_refresh_tokens(self.user)
        self.cookie_header = f"{ACCESS_COOKIE}={access_token}".encode()

    def test_handshake_requires_valid_cookie_auth(self):
        response = self._connect_once(
            headers=[
                (b"origin", b"http://localhost:5173"),
                (b"cookie", self.cookie_header),
            ]
        )

        self.assertEqual(response["type"], "websocket.accept")

    def test_handshake_rejects_invalid_origin(self):
        response = self._connect_once(
            headers=[
                (b"origin", b"http://evil.example"),
                (b"cookie", self.cookie_header),
            ]
        )

        self.assertEqual(response["type"], "websocket.close")

    def test_handshake_rejects_missing_auth_cookie(self):
        response = self._connect_once(
            headers=[
                (b"origin", b"http://localhost:5173"),
            ]
        )

        self.assertEqual(response["type"], "websocket.close")
        self.assertEqual(response["code"], 4401)

    def test_event_envelope_v1_required_fields_and_types(self):
        recepcion_event = build_visit_status_changed_event(
            visit_id="VIS-1001",
            status="en_somatometria",
            sequence=1042,
            request_id="req-1001",
            correlation_id="corr-1001",
        )
        consulta_event = build_visit_closed_event(
            visit_id="VIS-1001",
            sequence=1043,
            request_id="req-1002",
            correlation_id="corr-1002",
        )

        validate_realtime_event_envelope(recepcion_event)
        validate_realtime_event_envelope(consulta_event)

        self.assertEqual(recepcion_event["version"], 1)
        self.assertIsInstance(recepcion_event["eventId"], str)
        self.assertIsInstance(recepcion_event["sequence"], int)
        self.assertGreater(recepcion_event["sequence"], 0)
        self.assertEqual(recepcion_event["entity"], "visit")

    def test_ordering_and_gap_semantics(self):
        first = evaluate_sequence_progression(last_sequence=None, incoming_sequence=1042)
        self.assertTrue(first.is_monotonic)
        self.assertFalse(first.has_gap)

        second = evaluate_sequence_progression(last_sequence=1042, incoming_sequence=1043)
        self.assertTrue(second.is_monotonic)
        self.assertFalse(second.has_gap)

        with_gap = evaluate_sequence_progression(last_sequence=1043, incoming_sequence=1045)
        self.assertTrue(with_gap.is_monotonic)
        self.assertTrue(with_gap.has_gap)
        self.assertEqual(with_gap.expected_sequence, 1044)

        out_of_order = evaluate_sequence_progression(last_sequence=1045, incoming_sequence=1044)
        self.assertFalse(out_of_order.is_monotonic)
        self.assertFalse(out_of_order.has_gap)

    def _connect_once(self, headers):
        async def run_connect():
            communicator = ApplicationCommunicator(
                application,
                {
                    "type": "websocket",
                    "path": WS_VISITS_STREAM_PATH,
                    "headers": headers,
                    "query_string": b"",
                    "subprotocols": [],
                },
            )

            await communicator.send_input({"type": "websocket.connect"})
            output = await communicator.receive_output(timeout=1)

            if output.get("type") == "websocket.accept":
                await communicator.send_input({"type": "websocket.disconnect", "code": 1000})

            await communicator.wait()
            return output

        return asyncio.run(run_connect())
