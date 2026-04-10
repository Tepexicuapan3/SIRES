from apps.authentication.services.token_service import (
    CSRF_COOKIE,
    RESET_COOKIE,
    create_reset_token,
    generate_csrf_token,
)
from apps.authentication.tests.factories import build_auth_user_fixture
from django.core.cache import cache
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase


@override_settings(
    CACHES={
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        }
    }
)
class BaseAuthIntegrationFlowTest(APITestCase):
    login_path = "/api/v1/auth/login"
    onboarding_path = "/api/v1/auth/complete-onboarding"
    request_reset_path = "/api/v1/auth/request-reset-code"
    reset_password_path = "/api/v1/auth/reset-password"

    username = "abelb"
    email = "abel@example.com"
    password = "Abel_180903"

    def setUp(self):
        cache.clear()
        fixture = build_auth_user_fixture(
            username=self.username,
            email=self.email,
            password=self.password,
            requires_onboarding=True,
        )
        self.user = fixture["user"]

    def _assert_error_contract(self, response, code: str, request_id: str):
        self.assertEqual(response.data["code"], code)
        self.assertIn("message", response.data)
        self.assertIn("status", response.data)
        self.assertIn("timestamp", response.data)
        self.assertEqual(response.data["requestId"], request_id)
        self.assertEqual(response["X-Request-ID"], request_id)

    def _login(self, request_id: str):
        response = self.client.post(
            self.login_path,
            {"username": self.username, "password": self.password},
            format="json",
            HTTP_X_REQUEST_ID=request_id,
        )
        self.client.cookies = response.cookies
        return response


class LoginIntegrationFlowTests(BaseAuthIntegrationFlowTest):
    def test_login_happy_path_returns_contract_and_request_id_header(self):
        response = self._login("req-kan-88-login-success")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["X-Request-ID"], "req-kan-88-login-success")
        self.assertIn("user", response.data)
        self.assertIn("requiresOnboarding", response.data)
        self.assertEqual(response.data["user"]["username"], self.username)

    def test_login_invalid_credentials_returns_error_contract_with_request_id(self):
        response = self.client.post(
            self.login_path,
            {"username": self.username, "password": "ClaveMala1"},
            format="json",
            HTTP_X_REQUEST_ID="req-kan-88-login-invalid",
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self._assert_error_contract(
            response,
            code="INVALID_CREDENTIALS",
            request_id="req-kan-88-login-invalid",
        )


class OnboardingIntegrationFlowTests(BaseAuthIntegrationFlowTest):
    def test_complete_onboarding_with_csrf_returns_success_contract(self):
        login_response = self._login("req-kan-88-onboarding-login")
        csrf_token = login_response.cookies.get(CSRF_COOKIE).value

        response = self.client.post(
            self.onboarding_path,
            {"newPassword": "Nueva_Clave_Segura_123", "termsAccepted": True},
            format="json",
            HTTP_X_CSRF_TOKEN=csrf_token,
            HTTP_X_REQUEST_ID="req-kan-88-onboarding-success",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["X-Request-ID"], "req-kan-88-onboarding-success")
        self.assertFalse(response.data["requiresOnboarding"])

    def test_complete_onboarding_without_csrf_rejected_with_error_contract(self):
        self._login("req-kan-88-onboarding-login-missing-csrf")

        response = self.client.post(
            self.onboarding_path,
            {"newPassword": "Nueva_Clave_Segura_123", "termsAccepted": True},
            format="json",
            HTTP_X_REQUEST_ID="req-kan-88-onboarding-csrf-missing",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self._assert_error_contract(
            response,
            code="PERMISSION_DENIED",
            request_id="req-kan-88-onboarding-csrf-missing",
        )

    @override_settings(
        AUTH_PASSWORD_VALIDATORS=[
            {
                "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
                "OPTIONS": {"min_length": 12},
            }
        ]
    )
    def test_complete_onboarding_password_weak_returns_error_contract(self):
        login_response = self._login("req-kan-88-onboarding-login-weak")
        csrf_token = login_response.cookies.get(CSRF_COOKIE).value

        response = self.client.post(
            self.onboarding_path,
            {"newPassword": "corta", "termsAccepted": True},
            format="json",
            HTTP_X_CSRF_TOKEN=csrf_token,
            HTTP_X_REQUEST_ID="req-kan-88-onboarding-weak-password",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self._assert_error_contract(
            response,
            code="PASSWORD_TOO_WEAK",
            request_id="req-kan-88-onboarding-weak-password",
        )


class ResetPasswordIntegrationFlowTests(BaseAuthIntegrationFlowTest):
    def test_request_reset_code_success_returns_request_id_header(self):
        response = self.client.post(
            self.request_reset_path,
            {"email": self.email},
            format="json",
            HTTP_X_REQUEST_ID="req-kan-88-reset-request-success",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertEqual(response["X-Request-ID"], "req-kan-88-reset-request-success")

    def test_request_reset_code_user_not_found_returns_error_contract(self):
        response = self.client.post(
            self.request_reset_path,
            {"email": "missing@example.com"},
            format="json",
            HTTP_X_REQUEST_ID="req-kan-88-reset-user-not-found",
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self._assert_error_contract(
            response,
            code="USER_NOT_FOUND",
            request_id="req-kan-88-reset-user-not-found",
        )

    def test_reset_password_with_csrf_and_token_returns_success_contract(self):
        reset_token = create_reset_token(self.user)
        self.client.cookies[RESET_COOKIE] = reset_token

        csrf_token = generate_csrf_token()
        self.client.cookies[CSRF_COOKIE] = csrf_token

        response = self.client.post(
            self.reset_password_path,
            {"newPassword": "Nueva_Clave_123"},
            format="json",
            HTTP_X_CSRF_TOKEN=csrf_token,
            HTTP_X_REQUEST_ID="req-kan-88-reset-password-success",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["X-Request-ID"], "req-kan-88-reset-password-success")
        self.assertIn("requiresOnboarding", response.data)

    def test_reset_password_without_csrf_rejected_with_error_contract(self):
        reset_token = create_reset_token(self.user)
        self.client.cookies[RESET_COOKIE] = reset_token

        csrf_token = generate_csrf_token()
        self.client.cookies[CSRF_COOKIE] = csrf_token

        response = self.client.post(
            self.reset_password_path,
            {"newPassword": "Nueva_Clave_123"},
            format="json",
            HTTP_X_REQUEST_ID="req-kan-88-reset-password-csrf-missing",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self._assert_error_contract(
            response,
            code="PERMISSION_DENIED",
            request_id="req-kan-88-reset-password-csrf-missing",
        )
