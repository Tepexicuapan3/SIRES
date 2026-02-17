from unittest.mock import patch

from django.contrib.auth.hashers import make_password
from django.core.exceptions import ValidationError
from django.core.cache import cache
from django.test import TestCase
from rest_framework_simplejwt.exceptions import TokenError

from apps.authentication.models import DetUsuario, SyUsuario
from apps.authentication.services.errors import AuthServiceError
from apps.authentication.services.token_service import create_reset_token
from apps.authentication.uses_case.login_usecase import _increment_attempts
from apps.authentication.uses_case.onboarding_usecase import complete_onboarding
from apps.authentication.uses_case.refresh_usecase import refresh_tokens
from apps.authentication.uses_case.request_reset_code_usecase import request_reset_code
from apps.authentication.uses_case.reset_password_usecase import reset_password
from apps.authentication.uses_case.verify_reset_code_usecase import verify_reset_code


class AuthUseCasesTests(TestCase):
    def setUp(self):
        self.user = SyUsuario.objects.create(
            usuario="usecase_user",
            correo="usecase.user@example.com",
            clave_hash=make_password("Usecase_123456"),
            est_activo=True,
            cambiar_clave=True,
            terminos_acept=False,
        )
        DetUsuario.objects.create(
            id_usuario=self.user,
            nombre="Usecase",
            paterno="User",
            materno="",
            nombre_completo="Usecase User",
        )

    @patch("apps.authentication.uses_case.onboarding_usecase.validate_password")
    def test_complete_onboarding_password_too_weak_raises(self, validate_mock):
        validate_mock.side_effect = ValidationError(["weak"])

        with self.assertRaises(AuthServiceError) as ctx:
            complete_onboarding(self.user, "weak", True, "127.0.0.1")

        self.assertEqual(ctx.exception.code, "PASSWORD_TOO_WEAK")

    def test_complete_onboarding_requires_terms(self):
        with self.assertRaises(AuthServiceError) as ctx:
            complete_onboarding(self.user, "Valida_123456", False, "127.0.0.1")

        self.assertEqual(ctx.exception.code, "TERMS_NOT_ACCEPTED")

    def test_complete_onboarding_already_completed_path(self):
        self.user.cambiar_clave = False
        self.user.terminos_acept = True
        self.user.save(update_fields=["cambiar_clave", "terminos_acept"])

        result = complete_onboarding(self.user, "Valida_123456", True, "127.0.0.1")

        self.assertIn("user", result)
        self.assertIn("access_token", result)
        self.assertIn("refresh_token", result)

    @patch("apps.authentication.uses_case.request_reset_code_usecase.rate_limit_request")
    def test_request_reset_code_rate_limit(self, rate_limit_mock):
        rate_limit_mock.return_value = True

        with self.assertRaises(AuthServiceError) as ctx:
            request_reset_code("usecase.user@example.com")

        self.assertEqual(ctx.exception.code, "RATE_LIMIT_EXCEEDED")

    @patch("apps.authentication.uses_case.request_reset_code_usecase.send_reset_code_email")
    @patch("apps.authentication.uses_case.request_reset_code_usecase.generate_code")
    def test_request_reset_code_uses_username_when_no_profile_name(self, code_mock, send_mock):
        self.user.detalle.nombre = ""
        self.user.detalle.paterno = ""
        self.user.detalle.materno = ""
        self.user.detalle.nombre_completo = ""
        self.user.detalle.save()

        code_mock.return_value = "123456"
        send_mock.return_value = True

        request_reset_code("usecase.user@example.com")

        send_mock.assert_called_once()
        args, kwargs = send_mock.call_args
        self.assertEqual(args[0], "usecase.user@example.com")
        self.assertEqual(kwargs["user_name"], "usecase_user")

    @patch("apps.authentication.uses_case.reset_password_usecase.decode_reset_token")
    def test_reset_password_invalid_token_error(self, decode_mock):
        decode_mock.side_effect = TokenError("invalid token")

        with self.assertRaises(AuthServiceError) as ctx:
            reset_password("bad-token", "Nueva_123456", "127.0.0.1")

        self.assertEqual(ctx.exception.code, "TOKEN_INVALID")

    @patch("apps.authentication.uses_case.reset_password_usecase.decode_reset_token")
    def test_reset_password_expired_token_error(self, decode_mock):
        decode_mock.side_effect = TokenError("token expired")

        with self.assertRaises(AuthServiceError) as ctx:
            reset_password("expired-token", "Nueva_123456", "127.0.0.1")

        self.assertEqual(ctx.exception.code, "TOKEN_EXPIRED")

    @patch("apps.authentication.uses_case.reset_password_usecase.decode_reset_token")
    def test_reset_password_user_not_found(self, decode_mock):
        decode_mock.return_value = {"user_id": "999999"}

        with self.assertRaises(AuthServiceError) as ctx:
            reset_password("token", "Nueva_123456", "127.0.0.1")

        self.assertEqual(ctx.exception.code, "USER_NOT_FOUND")

    @patch("apps.authentication.uses_case.reset_password_usecase.validate_password")
    def test_reset_password_password_too_weak(self, validate_mock):
        token = create_reset_token(self.user)
        validate_mock.side_effect = ValidationError(["weak"])

        with self.assertRaises(AuthServiceError) as ctx:
            reset_password(token, "corta", "127.0.0.1")

        self.assertEqual(ctx.exception.code, "PASSWORD_TOO_WEAK")

    def test_verify_reset_code_user_not_found_after_valid_code(self):
        from apps.authentication.services.otp_service import store_code

        store_code("ghost.user@example.com", "123456")
        with self.assertRaises(AuthServiceError) as ctx:
            verify_reset_code("ghost.user@example.com", "123456")

        self.assertEqual(ctx.exception.code, "CODE_EXPIRED")

    def test_verify_reset_code_when_attempt_limit_already_reached(self):
        from apps.authentication.services.otp_service import OTP_ATTEMPT_LIMIT, store_code

        email = "usecase.user@example.com"
        store_code(email, "123456")
        cache_key = f"otp:{email}"
        otp_data = cache.get(cache_key)
        otp_data["attempts"] = OTP_ATTEMPT_LIMIT
        cache.set(cache_key, otp_data, 300)

        with self.assertRaises(AuthServiceError) as ctx:
            verify_reset_code(email, "123456")

        self.assertEqual(ctx.exception.code, "RATE_LIMIT_EXCEEDED")

    def test_refresh_tokens_session_expired_for_inactive_user(self):
        # Use refresh token normal para este flujo
        from apps.authentication.services.token_service import create_access_refresh_tokens

        _, refresh = create_access_refresh_tokens(self.user)
        self.user.est_activo = False
        self.user.save(update_fields=["est_activo"])

        with self.assertRaises(AuthServiceError) as ctx:
            refresh_tokens(refresh)

        self.assertEqual(ctx.exception.code, "SESSION_EXPIRED")

    def test_increment_attempts_accepts_none_user(self):
        _increment_attempts(None)
