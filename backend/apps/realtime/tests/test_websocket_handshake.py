import asyncio

from asgiref.testing import ApplicationCommunicator
from django.contrib.auth.hashers import make_password
from django.test import TestCase, override_settings

from apps.administracion.models import RelUsuarioRol
from apps.authentication.models import SyUsuario
from apps.catalogos.models import Roles
from apps.authentication.services.token_service import (
    ACCESS_COOKIE,
    create_access_refresh_tokens,
)
from apps.realtime.routing import WS_VISITS_STREAM_PATH
from config.asgi import application


@override_settings(
    ALLOWED_HOSTS=["localhost", "testserver"],
    WS_ALLOW_ALL_ORIGINS=False,
    WS_ALLOWED_ORIGINS="http://localhost:5173",
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
        recepcion_role, _ = Roles.objects.get_or_create(
            rol="RECEPCION",
            defaults={
                "desc_rol": "Recepcion",
                "landing_route": "/recepcion/fichas/medicina-general",
                "is_active": True,
            },
        )
        RelUsuarioRol.objects.create(
            id_usuario=self.user,
            id_rol=recepcion_role,
            is_primary=True,
        )

        self.user_without_stream_role = SyUsuario.objects.create(
            usuario="ws_no_role",
            correo="ws_no_role@example.com",
            clave_hash=make_password("Secret123!"),
            est_activo=True,
            cambiar_clave=False,
            terminos_acept=True,
        )

        self.admin_user = SyUsuario.objects.create(
            usuario="ws_admin_user",
            correo="ws_admin_user@example.com",
            clave_hash=make_password("Secret123!"),
            est_activo=True,
            cambiar_clave=False,
            terminos_acept=True,
        )
        admin_role, _ = Roles.objects.get_or_create(
            rol="ADMIN",
            defaults={
                "desc_rol": "Administracion",
                "landing_route": "/dashboard",
                "is_active": True,
                "is_admin": True,
            },
        )
        RelUsuarioRol.objects.create(
            id_usuario=self.admin_user,
            id_rol=admin_role,
            is_primary=True,
        )

        access_token, _ = create_access_refresh_tokens(self.user)
        self.cookie_header = f"{ACCESS_COOKIE}={access_token}".encode()
        blocked_token, _ = create_access_refresh_tokens(self.user_without_stream_role)
        self.blocked_cookie_header = f"{ACCESS_COOKIE}={blocked_token}".encode()
        admin_token, _ = create_access_refresh_tokens(self.admin_user)
        self.admin_cookie_header = f"{ACCESS_COOKIE}={admin_token}".encode()

    def test_connection_accepts_valid_cookie_auth(self):
        response = self._connect_once(
            headers=[
                (b"origin", b"http://localhost:5173"),
                (b"cookie", self.admin_cookie_header),
            ],
            query_string=b"",
        )

        self.assertEqual(response["type"], "websocket.accept")

    def test_connection_accepts_admin_with_wildcard_permissions(self):
        response = self._connect_once(
            headers=[
                (b"origin", b"http://localhost:5173"),
                (b"cookie", self.admin_cookie_header),
            ],
            query_string=b"",
        )

        self.assertEqual(response["type"], "websocket.accept")

    @override_settings(
        DEBUG=True,
        ALLOW_ALL_HOSTS=True,
        WS_ALLOW_ALL_ORIGINS=False,
        WS_ALLOWED_ORIGINS="",
    )
    def test_connection_accepts_origin_when_debug_allow_all_hosts_enabled(self):
        response = self._connect_once(
            headers=[
                (b"origin", b"http://localhost:5173"),
                (b"cookie", self.admin_cookie_header),
            ],
            query_string=b"",
        )

        self.assertEqual(response["type"], "websocket.accept")

    @override_settings(
        DEBUG=False,
        WS_ALLOW_ALL_ORIGINS=False,
        WS_ALLOWED_ORIGINS="",
        ALLOWED_HOSTS=["localhost", "testserver"],
    )
    def test_connection_accepts_origin_matching_allowed_hosts_fallback(self):
        response = self._connect_once(
            headers=[
                (b"origin", b"http://localhost:5173"),
                (b"cookie", self.admin_cookie_header),
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
                (b"cookie", self.admin_cookie_header),
            ],
            query_string=b"",
        )

        self.assertEqual(response["type"], "websocket.close")

    def test_connection_rejects_token_in_query_string(self):
        response = self._connect_once(
            headers=[
                (b"origin", b"http://localhost:5173"),
                (b"cookie", self.admin_cookie_header),
            ],
            query_string=b"access_token=forbidden-token",
        )

        self.assertEqual(response["type"], "websocket.close")
        self.assertEqual(response.get("code"), 4401)

    def test_connection_rejects_authenticated_user_without_stream_access(self):
        response = self._connect_once(
            headers=[
                (b"origin", b"http://localhost:5173"),
                (b"cookie", self.blocked_cookie_header),
            ],
            query_string=b"",
        )

        self.assertEqual(response["type"], "websocket.close")
        self.assertEqual(response.get("code"), 4403)

    def test_connection_rejects_role_only_user_without_stream_capability(self):
        response = self._connect_once(
            headers=[
                (b"origin", b"http://localhost:5173"),
                (b"cookie", self.cookie_header),
            ],
            query_string=b"",
        )

        self.assertEqual(response["type"], "websocket.close")
        self.assertEqual(response.get("code"), 4403)

    def _connect_once(self, *, headers, query_string):
        async def run_connect():
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
            output = await communicator.receive_output(timeout=1)

            if output.get("type") == "websocket.accept":
                await communicator.send_input({"type": "websocket.disconnect", "code": 1000})

            await communicator.wait()
            return output

        return asyncio.run(run_connect())
