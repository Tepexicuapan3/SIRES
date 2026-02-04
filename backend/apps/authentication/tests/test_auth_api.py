from unittest.mock import patch

from apps.administracion.models import (AuditoriaEvento, RelRolPermiso,
                                        RelUsuarioRol)
from apps.authentication.models import DetUsuario, SyUsuario
from apps.authentication.services.otp_service import store_code
from apps.authentication.services.token_service import (ACCESS_COOKIE,
                                                        CSRF_COOKIE,
                                                        REFRESH_COOKIE,
                                                        RESET_COOKIE,
                                                        create_reset_token,
                                                        generate_csrf_token)
from apps.catalogos.models import CatPermiso, CatRol
from django.contrib.auth.hashers import make_password
from django.core.cache import cache
from django.test import override_settings
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase


@override_settings(
    CACHES={
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        }
    }
)
class AuthApiTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.user = SyUsuario.objects.create(
            usuario="abelb",
            correo="abel@example.com",
            clave_hash=make_password("Abel_180903"),
            est_activo=True,
            cambiar_clave=True,
            terminos_acept=False,
        )
        DetUsuario.objects.create(
            id_usuario=self.user,
            nombre="Abel",
            paterno="Buendia",
            materno="Velazco",
            nombre_completo="Abel Buendia Velazco",
        )
        self.role = CatRol.objects.create(
            rol="MEDICO",
            desc_rol="Medico",
            landing_route="/expedientes",
        )
        RelUsuarioRol.objects.create(
            id_usuario=self.user,
            id_rol=self.role,
            is_primary=True,
        )
        self.perm = CatPermiso.objects.create(
            codigo="expedientes:read",
            descripcion="Leer expedientes",
        )
        RelRolPermiso.objects.create(id_rol=self.role, id_permiso=self.perm)

    def _login(self):
        response = self.client.post(
            "/api/v1/auth/login",
            {"username": "abelb", "password": "Abel_180903"},
            format="json",
            HTTP_X_REQUEST_ID="11111111-1111-1111-1111-111111111111",
        )
        self.client.cookies = response.cookies
        return response

    def test_login_sets_cookies(self):
        response = self._login()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn(ACCESS_COOKIE, response.cookies)
        self.assertIn(REFRESH_COOKIE, response.cookies)
        self.assertIn(CSRF_COOKIE, response.cookies)
        self.assertEqual(response.cookies[ACCESS_COOKIE]["samesite"], "Lax")
        self.assertEqual(response.cookies[REFRESH_COOKIE]["samesite"], "Strict")
        self.assertIn("user", response.data)
        self.assertTrue(response.data["requiresOnboarding"])
        self.assertEqual(response.data["user"]["primaryRole"], "MEDICO")
        self.assertEqual(response.data["user"]["landingRoute"], "/expedientes")
        self.assertEqual(response.data["user"]["roles"], ["MEDICO"])
        self.assertEqual(response.data["user"]["permissions"], ["expedientes:read"])
        self.assertTrue(response.data["user"]["requiresOnboarding"])
        self.assertEqual(
            AuditoriaEvento.objects.filter(accion="LOGIN_SUCCESS").count(), 1
        )

    def test_login_rejects_when_session_active(self):
        self._login()

        response = self.client.post(
            "/api/v1/auth/login",
            {"username": "abelb", "password": "Abel_180903"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(response.data["code"], "SESSION_ACTIVE")

    def test_login_invalid_password_has_request_id(self):
        response = self.client.post(
            "/api/v1/auth/login",
            {"username": "abelb", "password": "ClaveMala1"},
            format="json",
            HTTP_X_REQUEST_ID="req-123",
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data["code"], "INVALID_CREDENTIALS")
        self.assertEqual(response.data["requestId"], "req-123")
        self.assertIn("timestamp", response.data)

    def test_me_returns_user(self):
        self._login()

        response = self.client.get("/api/v1/auth/me")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], "abelb")
        self.assertEqual(response.data["roles"], ["MEDICO"])
        self.assertEqual(response.data["permissions"], ["expedientes:read"])

    def test_verify_requires_auth(self):
        response = self.client.get("/api/v1/auth/verify")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data, {"valid": False})

        self._login()
        response = self.client.get("/api/v1/auth/verify")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {"valid": True})

    def test_refresh_rotates_tokens(self):
        login_response = self._login()

        csrf_token = login_response.cookies.get(CSRF_COOKIE).value

        refresh_token = login_response.cookies.get(REFRESH_COOKIE).value
        self.client.cookies[REFRESH_COOKIE] = refresh_token

        response = self.client.post(
            "/api/v1/auth/refresh",
            HTTP_X_CSRF_TOKEN=csrf_token,
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn(ACCESS_COOKIE, response.cookies)
        self.assertIn(CSRF_COOKIE, response.cookies)
        self.assertTrue(response.data["success"])

    def test_refresh_missing_cookie(self):
        response = self.client.post("/api/v1/auth/refresh")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data["code"], "TOKEN_INVALID")

    def test_refresh_requires_csrf(self):
        login_response = self._login()

        refresh_token = login_response.cookies.get(REFRESH_COOKIE).value
        self.client.cookies[REFRESH_COOKIE] = refresh_token

        response = self.client.post("/api/v1/auth/refresh")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data["code"], "PERMISSION_DENIED")

    def test_logout_requires_csrf(self):
        login_response = self._login()
        csrf_token = login_response.cookies.get(CSRF_COOKIE).value

        response = self.client.post("/api/v1/auth/logout")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data["code"], "PERMISSION_DENIED")

        response = self.client.post(
            "/api/v1/auth/logout",
            HTTP_X_CSRF_TOKEN=csrf_token,
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])

    def test_complete_onboarding(self):
        login_response = self._login()
        csrf_token = login_response.cookies.get(CSRF_COOKIE).value

        response = self.client.post(
            "/api/v1/auth/complete-onboarding",
            {"newPassword": "Abel_180903", "termsAccepted": True},
            format="json",
            HTTP_X_CSRF_TOKEN=csrf_token,
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["requiresOnboarding"])
        self.user.refresh_from_db()
        self.assertFalse(self.user.cambiar_clave)
        self.assertTrue(self.user.terminos_acept)

    @override_settings(
        AUTH_PASSWORD_VALIDATORS=[
            {
                "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
                "OPTIONS": {"min_length": 12},
            }
        ]
    )
    def test_complete_onboarding_password_weak(self):
        login_response = self._login()
        csrf_token = login_response.cookies.get(CSRF_COOKIE).value

        response = self.client.post(
            "/api/v1/auth/complete-onboarding",
            {"newPassword": "corta", "termsAccepted": True},
            format="json",
            HTTP_X_CSRF_TOKEN=csrf_token,
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["code"], "PASSWORD_TOO_WEAK")

    def test_request_reset_code(self):
        response = self.client.post(
            "/api/v1/auth/request-reset-code",
            {"email": "abel@example.com"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])

    def test_request_reset_code_user_not_found(self):
        response = self.client.post(
            "/api/v1/auth/request-reset-code",
            {"email": "missing@example.com"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data["code"], "USER_NOT_FOUND")
        self.assertIn("timestamp", response.data)

    @patch("apps.authentication.uses_case.request_reset_code_usecase.send_reset_code_email")
    def test_request_reset_code_email_failure(self, send_mail_mock):
        send_mail_mock.return_value = False

        response = self.client.post(
            "/api/v1/auth/request-reset-code",
            {"email": "abel@example.com"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertEqual(response.data["code"], "INTERNAL_SERVER_ERROR")

    def test_verify_reset_code_sets_cookie(self):
        store_code("abel@example.com", "123456")

        response = self.client.post(
            "/api/v1/auth/verify-reset-code",
            {"email": "abel@example.com", "code": "123456"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {"valid": True})
        self.assertIn(RESET_COOKIE, response.cookies)
        self.assertIn(CSRF_COOKIE, response.cookies)

    def test_verify_reset_code_invalid(self):
        store_code("abel@example.com", "123456")

        response = self.client.post(
            "/api/v1/auth/verify-reset-code",
            {"email": "abel@example.com", "code": "000000"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["code"], "INVALID_CODE")

    def test_verify_reset_code_rate_limit(self):
        store_code("abel@example.com", "123456")

        response = None
        for _ in range(5):
            response = self.client.post(
                "/api/v1/auth/verify-reset-code",
                {"email": "abel@example.com", "code": "000000"},
                format="json",
            )

        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        self.assertEqual(response.data["code"], "RATE_LIMIT_EXCEEDED")

    def test_verify_reset_code_expired(self):
        response = self.client.post(
            "/api/v1/auth/verify-reset-code",
            {"email": "abel@example.com", "code": "123456"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["code"], "CODE_EXPIRED")

    def test_reset_password(self):
        reset_token = create_reset_token(self.user)
        self.client.cookies[RESET_COOKIE] = reset_token

        csrf_token = generate_csrf_token()
        self.client.cookies[CSRF_COOKIE] = csrf_token

        response = self.client.post(
            "/api/v1/auth/reset-password",
            {"newPassword": "Nueva_Clave_123"},
            format="json",
            HTTP_X_CSRF_TOKEN=csrf_token,
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn(ACCESS_COOKIE, response.cookies)
        self.assertTrue(response.data["requiresOnboarding"])

    def test_reset_password_requires_csrf(self):
        reset_token = create_reset_token(self.user)
        self.client.cookies[RESET_COOKIE] = reset_token

        csrf_token = generate_csrf_token()
        self.client.cookies[CSRF_COOKIE] = csrf_token

        response = self.client.post(
            "/api/v1/auth/reset-password",
            {"newPassword": "Nueva_Clave_123"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data["code"], "PERMISSION_DENIED")

    def test_reset_password_missing_token(self):
        response = self.client.post(
            "/api/v1/auth/reset-password",
            {"newPassword": "Nueva_Clave_123"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data["code"], "TOKEN_INVALID")

    @override_settings(
        AUTH_PASSWORD_VALIDATORS=[
            {
                "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
                "OPTIONS": {"min_length": 12},
            }
        ]
    )
    def test_reset_password_password_weak(self):
        reset_token = create_reset_token(self.user)
        self.client.cookies[RESET_COOKIE] = reset_token

        csrf_token = generate_csrf_token()
        self.client.cookies[CSRF_COOKIE] = csrf_token

        response = self.client.post(
            "/api/v1/auth/reset-password",
            {"newPassword": "corta"},
            format="json",
            HTTP_X_CSRF_TOKEN=csrf_token,
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["code"], "PASSWORD_TOO_WEAK")

    def test_login_attempts_cleared_after_success(self):
        response = self.client.post(
            "/api/v1/auth/login",
            {"username": "abelb", "password": "ClaveMala1"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        success = self._login()
        self.assertEqual(success.status_code, status.HTTP_200_OK)
        self.client.cookies.clear()

        response = self.client.post(
            "/api/v1/auth/login",
            {"username": "abelb", "password": "ClaveMala1"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_user_inactive(self):
        self.user.est_activo = False
        self.user.save(update_fields=["est_activo"])

        response = self.client.post(
            "/api/v1/auth/login",
            {"username": "abelb", "password": "Abel_180903"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data["code"], "USER_INACTIVE")

    def test_login_user_blocked(self):
        self.user.est_bloqueado = True
        self.user.save(update_fields=["est_bloqueado"])

        response = self.client.post(
            "/api/v1/auth/login",
            {"username": "abelb", "password": "Abel_180903"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_423_LOCKED)
        self.assertEqual(response.data["code"], "ACCOUNT_LOCKED")

    def test_login_user_expired(self):
        self.user.fch_baja = timezone.now()
        self.user.save(update_fields=["fch_baja"])

        response = self.client.post(
            "/api/v1/auth/login",
            {"username": "abelb", "password": "Abel_180903"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data["code"], "ACCOUNT_EXPIRED")

    def test_login_user_not_found(self):
        response = self.client.post(
            "/api/v1/auth/login",
            {"username": "missing", "password": "Abel_180903"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data["code"], "USER_NOT_FOUND")
        self.assertIn("timestamp", response.data)

    def test_login_invalid_password(self):
        response = self.client.post(
            "/api/v1/auth/login",
            {"username": "abelb", "password": "ClaveMala1"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data["code"], "INVALID_CREDENTIALS")

    def test_login_rate_limit(self):
        for _ in range(5):
            response = self.client.post(
                "/api/v1/auth/login",
                {"username": "abelb", "password": "ClaveMala1"},
                format="json",
            )

        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        self.assertEqual(response.data["code"], "RATE_LIMIT_EXCEEDED")
