from unittest.mock import patch

from django.contrib.auth.hashers import make_password
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from apps.administracion.models import RelUsuarioRol
from apps.authentication.models import DetUsuario, SyUsuario
from apps.authentication.services.errors import AuthServiceError
from apps.authentication.services.token_service import (CSRF_COOKIE,
                                                        REFRESH_COOKIE,
                                                        generate_csrf_token)
from apps.catalogos.models import Roles


@override_settings(
    CACHES={
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        }
    }
)
class AuthContractEdgeTests(APITestCase):
    def setUp(self):
        self.user = SyUsuario.objects.create(
            usuario="edge_user",
            correo="edge.user@example.com",
            clave_hash=make_password("Edge_123456"),
            est_activo=True,
            cambiar_clave=True,
            terminos_acept=False,
        )
        DetUsuario.objects.create(
            id_usuario=self.user,
            nombre="Edge",
            paterno="User",
            materno="",
            nombre_completo="Edge User",
        )

        role = Roles.objects.create(
            rol="EDGE_ROLE",
            desc_rol="Rol edge",
            landing_route="/edge",
            is_active=True,
        )
        RelUsuarioRol.objects.create(id_usuario=self.user, id_rol=role, is_primary=True)

    def _login(self):
        response = self.client.post(
            "/api/v1/auth/login",
            {"username": "edge_user", "password": "Edge_123456"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.client.cookies = response.cookies
        return response

    def test_me_without_session_returns_token_invalid(self):
        response = self.client.get("/api/v1/auth/me")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data["code"], "TOKEN_INVALID")

    def test_logout_without_session_returns_token_invalid(self):
        response = self.client.post("/api/v1/auth/logout")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data["code"], "TOKEN_INVALID")

    def test_complete_onboarding_requires_csrf(self):
        self._login()

        response = self.client.post(
            "/api/v1/auth/complete-onboarding",
            {"newPassword": "Edge_1234567", "termsAccepted": True},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data["code"], "PERMISSION_DENIED")

    def test_complete_onboarding_requires_session(self):
        response = self.client.post(
            "/api/v1/auth/complete-onboarding",
            {"newPassword": "Edge_1234567", "termsAccepted": True},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data["code"], "TOKEN_INVALID")

    def test_complete_onboarding_requires_terms_acceptance(self):
        login_response = self._login()
        csrf_token = login_response.cookies.get(CSRF_COOKIE).value

        response = self.client.post(
            "/api/v1/auth/complete-onboarding",
            {"newPassword": "Edge_1234567", "termsAccepted": False},
            format="json",
            HTTP_X_CSRF_TOKEN=csrf_token,
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["code"], "TERMS_NOT_ACCEPTED")

    def test_complete_onboarding_validation_errors_for_missing_terms(self):
        login_response = self._login()
        csrf_token = login_response.cookies.get(CSRF_COOKIE).value

        response = self.client.post(
            "/api/v1/auth/complete-onboarding",
            {"newPassword": "Edge_1234567"},
            format="json",
            HTTP_X_CSRF_TOKEN=csrf_token,
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["code"], "TERMS_NOT_ACCEPTED")

    def test_request_reset_code_invalid_email_returns_invalid_email(self):
        response = self.client.post(
            "/api/v1/auth/request-reset-code",
            {"email": "no-es-email"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["code"], "INVALID_EMAIL")

    def test_verify_reset_code_invalid_email_returns_invalid_email(self):
        response = self.client.post(
            "/api/v1/auth/verify-reset-code",
            {"email": "no-es-email", "code": "123456"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["code"], "INVALID_EMAIL")

    def test_verify_reset_code_invalid_length_returns_invalid_code(self):
        response = self.client.post(
            "/api/v1/auth/verify-reset-code",
            {"email": "edge.user@example.com", "code": "12345"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["code"], "INVALID_CODE")

    def test_refresh_with_invalid_cookie_returns_token_invalid(self):
        csrf_token = generate_csrf_token()
        self.client.cookies[REFRESH_COOKIE] = "refresh-token-invalido"
        self.client.cookies[CSRF_COOKIE] = csrf_token

        response = self.client.post(
            "/api/v1/auth/refresh",
            HTTP_X_CSRF_TOKEN=csrf_token,
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data["code"], "TOKEN_INVALID")

    def test_login_invalid_serializer_payload_returns_invalid_credentials(self):
        response = self.client.post(
            "/api/v1/auth/login",
            {"username": "", "password": ""},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data["code"], "INVALID_CREDENTIALS")

    @patch("apps.authentication.views.login_user")
    def test_login_unexpected_exception_returns_internal_server_error(self, login_user_mock):
        login_user_mock.side_effect = RuntimeError("boom")

        response = self.client.post(
            "/api/v1/auth/login",
            {"username": "edge_user", "password": "Edge_123456"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertEqual(response.data["code"], "INTERNAL_SERVER_ERROR")

    @patch("apps.authentication.views.refresh_tokens")
    def test_refresh_unexpected_exception_returns_internal_server_error(self, refresh_mock):
        login_response = self._login()
        csrf_token = login_response.cookies.get(CSRF_COOKIE).value
        self.client.cookies[REFRESH_COOKIE] = login_response.cookies.get(REFRESH_COOKIE).value
        refresh_mock.side_effect = RuntimeError("boom")

        response = self.client.post(
            "/api/v1/auth/refresh",
            HTTP_X_CSRF_TOKEN=csrf_token,
        )

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertEqual(response.data["code"], "INTERNAL_SERVER_ERROR")

    @patch("apps.authentication.views.complete_onboarding")
    def test_complete_onboarding_unexpected_exception_returns_onboarding_failed(self, onboarding_mock):
        login_response = self._login()
        csrf_token = login_response.cookies.get(CSRF_COOKIE).value
        onboarding_mock.side_effect = RuntimeError("boom")

        response = self.client.post(
            "/api/v1/auth/complete-onboarding",
            {"newPassword": "Edge_1234567", "termsAccepted": True},
            format="json",
            HTTP_X_CSRF_TOKEN=csrf_token,
        )

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertEqual(response.data["code"], "ONBOARDING_FAILED")

    @patch("apps.authentication.views.request_reset_code")
    def test_request_reset_code_unexpected_exception_returns_internal_server_error(self, reset_mock):
        reset_mock.side_effect = RuntimeError("boom")

        response = self.client.post(
            "/api/v1/auth/request-reset-code",
            {"email": "edge.user@example.com"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertEqual(response.data["code"], "INTERNAL_SERVER_ERROR")

    @patch("apps.authentication.views.verify_reset_code")
    def test_verify_reset_code_unexpected_exception_returns_internal_server_error(self, verify_mock):
        verify_mock.side_effect = RuntimeError("boom")

        response = self.client.post(
            "/api/v1/auth/verify-reset-code",
            {"email": "edge.user@example.com", "code": "123456"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertEqual(response.data["code"], "INTERNAL_SERVER_ERROR")

    @patch("apps.authentication.views.reset_password")
    def test_reset_password_unexpected_exception_returns_internal_server_error(self, reset_password_mock):
        self.client.cookies["reset_token"] = "token-reset-demo"
        csrf_token = generate_csrf_token()
        self.client.cookies[CSRF_COOKIE] = csrf_token
        reset_password_mock.side_effect = RuntimeError("boom")

        response = self.client.post(
            "/api/v1/auth/reset-password",
            {"newPassword": "Nueva_123456"},
            format="json",
            HTTP_X_CSRF_TOKEN=csrf_token,
        )

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertEqual(response.data["code"], "INTERNAL_SERVER_ERROR")

    @patch("apps.authentication.views.reset_password")
    def test_reset_password_auth_service_error_is_propagated(self, reset_password_mock):
        self.client.cookies["reset_token"] = "token-reset-demo"
        csrf_token = generate_csrf_token()
        self.client.cookies[CSRF_COOKIE] = csrf_token
        reset_password_mock.side_effect = AuthServiceError(
            "TOKEN_INVALID",
            "Token inválido",
            401,
        )

        response = self.client.post(
            "/api/v1/auth/reset-password",
            {"newPassword": "Nueva_123456"},
            format="json",
            HTTP_X_CSRF_TOKEN=csrf_token,
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data["code"], "TOKEN_INVALID")
