from datetime import timedelta
from unittest.mock import patch

from django.contrib.auth.hashers import make_password
from django.http import HttpResponse
from django.test import RequestFactory, TestCase
from django.utils import timezone
from rest_framework_simplejwt.exceptions import TokenBackendError, TokenError
from rest_framework_simplejwt.settings import api_settings
from rest_framework_simplejwt.tokens import AccessToken

from apps.authentication.models import DetUsuario, SyUsuario
from apps.authentication.services.csrf_service import validate_csrf
from apps.authentication.services.errors import AuthServiceError
from apps.authentication.services.response_service import (error_response,
                                                           get_request_id)
from apps.authentication.services.session_service import authenticate_request
from apps.authentication.services.token_service import (ACCESS_COOKIE,
                                                        CSRF_COOKIE,
                                                        RESET_COOKIE,
                                                        clear_auth_cookies,
                                                        clear_reset_cookie,
                                                        create_access_refresh_tokens,
                                                        create_reset_token,
                                                        decode_access_token,
                                                        decode_reset_token,
                                                        set_auth_cookies,
                                                        set_reset_cookie,
                                                        validate_refresh_token)


class AuthCoreServicesTests(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.user = SyUsuario.objects.create(
            usuario="core_user",
            correo="core.user@example.com",
            clave_hash=make_password("Core_123456"),
            est_activo=True,
            cambiar_clave=False,
            terminos_acept=True,
        )
        DetUsuario.objects.create(
            id_usuario=self.user,
            nombre="Core",
            paterno="User",
            materno="",
            nombre_completo="Core User",
        )

    def test_get_request_id_and_error_response_payload(self):
        request = self.factory.get("/api/test", HTTP_X_REQUEST_ID="req-abc")
        request_id = get_request_id(request)
        response = error_response(
            "VALIDATION_ERROR",
            "Datos invalidos",
            400,
            details={"field": ["error"]},
            request_id=request_id,
        )

        self.assertEqual(request_id, "req-abc")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["code"], "VALIDATION_ERROR")
        self.assertEqual(response.data["requestId"], "req-abc")
        self.assertIn("details", response.data)
        self.assertIn("timestamp", response.data)

    def test_validate_csrf(self):
        request = self.factory.post("/api/test", HTTP_X_CSRF_TOKEN="token-1")
        request.COOKIES[CSRF_COOKIE] = "token-1"
        self.assertTrue(validate_csrf(request))

        request_bad = self.factory.post("/api/test", HTTP_X_CSRF_TOKEN="token-2")
        request_bad.COOKIES[CSRF_COOKIE] = "token-1"
        self.assertFalse(validate_csrf(request_bad))

    def test_token_roundtrip_for_access_refresh_and_reset(self):
        access, refresh = create_access_refresh_tokens(self.user)

        access_payload = decode_access_token(access)
        refresh_token = validate_refresh_token(refresh)
        reset_token = create_reset_token(self.user)
        reset_payload = decode_reset_token(reset_token)

        self.assertEqual(access_payload[api_settings.TOKEN_TYPE_CLAIM], "access")
        self.assertEqual(refresh_token[api_settings.TOKEN_TYPE_CLAIM], "refresh")
        self.assertEqual(reset_payload[api_settings.TOKEN_TYPE_CLAIM], "reset")

    def test_token_type_validation_errors(self):
        access, refresh = create_access_refresh_tokens(self.user)

        with self.assertRaises(TokenError):
            validate_refresh_token(access)
        with self.assertRaises(TokenError):
            decode_access_token(refresh)
        with self.assertRaises(TokenError):
            decode_reset_token(access)

    @patch("apps.authentication.services.token_service.RefreshToken")
    def test_validate_refresh_token_invalid_token_type_branch(self, refresh_cls_mock):
        class FakeRefresh(dict):
            def get(self, key, default=None):
                return super().get(key, default)

        refresh_cls_mock.return_value = FakeRefresh({api_settings.TOKEN_TYPE_CLAIM: "access"})

        with self.assertRaises(TokenError):
            validate_refresh_token("fake")

    @patch("apps.authentication.services.token_service.AccessToken")
    def test_decode_access_token_invalid_token_type_branch(self, access_cls_mock):
        class FakeAccess(dict):
            def get(self, key, default=None):
                return super().get(key, default)

        access_cls_mock.return_value = FakeAccess({api_settings.TOKEN_TYPE_CLAIM: "refresh"})

        with self.assertRaises(TokenError):
            decode_access_token("fake")

    @patch("rest_framework_simplejwt.backends.TokenBackend.decode")
    def test_decode_reset_token_backend_error_branch(self, decode_mock):
        decode_mock.side_effect = TokenBackendError("broken")

        with self.assertRaises(TokenError):
            decode_reset_token("bad-reset-token")

    def test_cookie_helpers_set_and_clear_cookies(self):
        response = HttpResponse()
        set_auth_cookies(response, "access", "refresh", "csrf")
        set_reset_cookie(response, "reset")

        self.assertIn("access_token_cookie", response.cookies)
        self.assertIn("refresh_token_cookie", response.cookies)
        self.assertIn("csrf_token", response.cookies)
        self.assertIn(RESET_COOKIE, response.cookies)
        self.assertEqual(response.cookies["access_token_cookie"]["path"], "/")

        clear_auth_cookies(response)
        clear_reset_cookie(response)

        self.assertEqual(response.cookies["access_token_cookie"]["max-age"], 0)
        self.assertEqual(response.cookies["access_token_cookie"]["path"], "/")
        self.assertEqual(response.cookies["refresh_token_cookie"]["max-age"], 0)
        self.assertEqual(response.cookies["csrf_token"]["max-age"], 0)
        self.assertEqual(response.cookies[RESET_COOKIE]["max-age"], 0)

    def test_authenticate_request_error_paths(self):
        request_missing = self.factory.get("/api/test")
        with self.assertRaises(AuthServiceError) as missing_ctx:
            authenticate_request(request_missing)
        self.assertEqual(missing_ctx.exception.code, "TOKEN_INVALID")

        request_invalid = self.factory.get("/api/test")
        request_invalid.COOKIES[ACCESS_COOKIE] = "token-invalido"
        with self.assertRaises(AuthServiceError) as invalid_ctx:
            authenticate_request(request_invalid)
        self.assertEqual(invalid_ctx.exception.code, "TOKEN_INVALID")

    def test_authenticate_request_expired_and_user_state_paths(self):
        expired = AccessToken.for_user(self.user)
        expired.set_exp(from_time=timezone.now() - timedelta(minutes=30), lifetime=timedelta(seconds=1))

        request_expired = self.factory.get("/api/test")
        request_expired.COOKIES[ACCESS_COOKIE] = str(expired)
        with self.assertRaises(AuthServiceError) as expired_ctx:
            authenticate_request(request_expired)
        self.assertEqual(expired_ctx.exception.code, "TOKEN_EXPIRED")

        active_token = str(AccessToken.for_user(self.user))

        self.user.est_activo = False
        self.user.save(update_fields=["est_activo"])
        request_inactive = self.factory.get("/api/test")
        request_inactive.COOKIES[ACCESS_COOKIE] = active_token
        with self.assertRaises(AuthServiceError) as inactive_ctx:
            authenticate_request(request_inactive)
        self.assertEqual(inactive_ctx.exception.code, "PERMISSION_DENIED")

        self.user.est_activo = True
        self.user.est_bloqueado = True
        self.user.save(update_fields=["est_activo", "est_bloqueado"])
        request_blocked = self.factory.get("/api/test")
        request_blocked.COOKIES[ACCESS_COOKIE] = active_token
        with self.assertRaises(AuthServiceError) as blocked_ctx:
            authenticate_request(request_blocked)
        self.assertEqual(blocked_ctx.exception.code, "SESSION_EXPIRED")

    def test_authenticate_request_without_user_id_claim(self):
        token = AccessToken()
        token[api_settings.TOKEN_TYPE_CLAIM] = "access"
        token["custom"] = "value"

        request = self.factory.get("/api/test")
        request.COOKIES[ACCESS_COOKIE] = str(token)

        with self.assertRaises(AuthServiceError) as ctx:
            authenticate_request(request)

        self.assertEqual(ctx.exception.code, "TOKEN_INVALID")

    def test_authenticate_request_with_unknown_user_id(self):
        token = AccessToken.for_user(self.user)
        token[api_settings.USER_ID_CLAIM] = "999999"

        request = self.factory.get("/api/test")
        request.COOKIES[ACCESS_COOKIE] = str(token)

        with self.assertRaises(AuthServiceError) as ctx:
            authenticate_request(request)

        self.assertEqual(ctx.exception.code, "SESSION_EXPIRED")
