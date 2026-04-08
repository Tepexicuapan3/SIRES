from unittest.mock import patch

from django.test import SimpleTestCase, override_settings

from apps.authentication.services.email_service import (
    send_reset_code_email,
    send_user_credentials_email,
)


class EmailServiceTests(SimpleTestCase):
    @override_settings(
        EMAIL_BACKEND="django.core.mail.backends.smtp.EmailBackend",
        EMAIL_HOST="",
        EMAIL_HOST_USER="",
        EMAIL_HOST_PASSWORD="",
    )
    def test_returns_true_when_smtp_not_configured(self):
        result = send_reset_code_email("user@example.com", "123456", user_name="User")

        self.assertTrue(result)

    @override_settings(
        EMAIL_BACKEND="django.core.mail.backends.smtp.EmailBackend",
        EMAIL_HOST="smtp.example.com",
        EMAIL_HOST_USER="mailer@example.com",
        EMAIL_HOST_PASSWORD="secret",
        DEFAULT_FROM_EMAIL="mailer@example.com",
    )
    @patch("apps.authentication.services.email_service.send_mail")
    @patch("apps.authentication.services.email_service.render_to_string")
    def test_sends_email_when_smtp_is_configured(self, render_mock, send_mail_mock):
        render_mock.return_value = "<html>ok</html>"
        send_mail_mock.return_value = 1

        result = send_reset_code_email("user@example.com", "123456", user_name="User")

        self.assertTrue(result)
        send_mail_mock.assert_called_once()

    @override_settings(
        EMAIL_BACKEND="django.core.mail.backends.smtp.EmailBackend",
        EMAIL_HOST="smtp.example.com",
        EMAIL_HOST_USER="mailer@example.com",
        EMAIL_HOST_PASSWORD="secret",
        DEFAULT_FROM_EMAIL="mailer@example.com",
    )
    @patch("apps.authentication.services.email_service.send_mail")
    @patch("apps.authentication.services.email_service.render_to_string")
    def test_returns_false_when_send_mail_fails(self, render_mock, send_mail_mock):
        render_mock.return_value = "<html>ok</html>"
        send_mail_mock.side_effect = RuntimeError("smtp down")

        result = send_reset_code_email("user@example.com", "123456", user_name="User")

        self.assertFalse(result)

    @override_settings(
        EMAIL_BACKEND="django.core.mail.backends.smtp.EmailBackend",
        EMAIL_HOST="",
        EMAIL_HOST_USER="",
        EMAIL_HOST_PASSWORD="",
    )
    def test_credentials_email_returns_false_when_smtp_not_configured(self):
        result = send_user_credentials_email(
            "user@example.com",
            username="new_user",
            temporary_password="TempPass_123456!",
            user_name="User",
        )

        self.assertFalse(result)

    @override_settings(
        EMAIL_BACKEND="django.core.mail.backends.smtp.EmailBackend",
        EMAIL_HOST="smtp.example.com",
        EMAIL_HOST_USER="mailer@example.com",
        EMAIL_HOST_PASSWORD="secret",
        DEFAULT_FROM_EMAIL="mailer@example.com",
    )
    @patch("apps.authentication.services.email_service.send_mail")
    @patch("apps.authentication.services.email_service.render_to_string")
    def test_credentials_email_sends_when_smtp_is_configured(
        self, render_mock, send_mail_mock
    ):
        render_mock.return_value = "<html>ok</html>"
        send_mail_mock.return_value = 1

        result = send_user_credentials_email(
            "user@example.com",
            username="new_user",
            temporary_password="TempPass_123456!",
            user_name="User",
        )

        self.assertTrue(result)
        send_mail_mock.assert_called_once()

    @override_settings(
        EMAIL_BACKEND="django.core.mail.backends.smtp.EmailBackend",
        EMAIL_HOST="smtp.example.com",
        EMAIL_HOST_USER="mailer@example.com",
        EMAIL_HOST_PASSWORD="secret",
        DEFAULT_FROM_EMAIL="mailer@example.com",
    )
    @patch("apps.authentication.services.email_service.send_mail")
    @patch("apps.authentication.services.email_service.render_to_string")
    def test_credentials_email_returns_false_when_send_mail_fails(
        self, render_mock, send_mail_mock
    ):
        render_mock.return_value = "<html>ok</html>"
        send_mail_mock.side_effect = RuntimeError("smtp down")

        result = send_user_credentials_email(
            "user@example.com",
            username="new_user",
            temporary_password="TempPass_123456!",
            user_name="User",
        )

        self.assertFalse(result)

    @override_settings(
        EMAIL_BACKEND="django.core.mail.backends.smtp.EmailBackend",
        EMAIL_HOST="smtp.example.com",
        EMAIL_HOST_USER="mailer@example.com",
        EMAIL_HOST_PASSWORD="secret",
        DEFAULT_FROM_EMAIL="mailer@example.com",
        SISEM_LOGIN_URL="https://sisem.example.com/login",
        SIRES_LOGIN_URL="https://legacy-sires.example.com/login",
        SISEM_SUPPORT_EMAIL="soporte@sisem.example.com",
        SIRES_SUPPORT_EMAIL="soporte@sires.example.com",
    )
    @patch("apps.authentication.services.email_service.send_mail")
    @patch("apps.authentication.services.email_service.render_to_string")
    def test_credentials_email_prefers_sisem_aliases(self, render_mock, send_mail_mock):
        render_mock.return_value = "<html>ok</html>"
        send_mail_mock.return_value = 1

        result = send_user_credentials_email(
            "user@example.com",
            username="new_user",
            temporary_password="TempPass_123456!",
            user_name="User",
        )

        self.assertTrue(result)
        subject, message = send_mail_mock.call_args.args[0:2]
        self.assertEqual(subject, "Credenciales de acceso a SISEM")
        self.assertIn("cuenta de SISEM", message)
        self.assertIn("https://sisem.example.com/login", message)
        self.assertIn("soporte@sisem.example.com", message)

    @override_settings(
        EMAIL_BACKEND="django.core.mail.backends.smtp.EmailBackend",
        EMAIL_HOST="smtp.example.com",
        EMAIL_HOST_USER="mailer@example.com",
        EMAIL_HOST_PASSWORD="secret",
        DEFAULT_FROM_EMAIL="mailer@example.com",
        SISEM_LOGIN_URL="",
        SISEM_SUPPORT_EMAIL="",
        SIRES_LOGIN_URL="https://legacy-sires.example.com/login",
        SIRES_SUPPORT_EMAIL="soporte@sires.example.com",
    )
    @patch("apps.authentication.services.email_service.send_mail")
    @patch("apps.authentication.services.email_service.render_to_string")
    def test_credentials_email_falls_back_to_legacy_sires_aliases(
        self, render_mock, send_mail_mock
    ):
        render_mock.return_value = "<html>ok</html>"
        send_mail_mock.return_value = 1

        result = send_user_credentials_email(
            "user@example.com",
            username="new_user",
            temporary_password="TempPass_123456!",
            user_name="User",
        )

        self.assertTrue(result)
        _, message = send_mail_mock.call_args.args[0:2]
        self.assertIn("https://legacy-sires.example.com/login", message)
        self.assertIn("soporte@sires.example.com", message)
