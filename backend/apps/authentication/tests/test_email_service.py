from unittest.mock import patch

from django.test import SimpleTestCase, override_settings

from apps.authentication.services.email_service import send_reset_code_email


class EmailServiceTests(SimpleTestCase):
    @override_settings(EMAIL_HOST="", EMAIL_HOST_USER="", EMAIL_HOST_PASSWORD="")
    def test_returns_true_when_smtp_not_configured(self):
        result = send_reset_code_email("user@example.com", "123456", user_name="User")

        self.assertTrue(result)

    @override_settings(
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
