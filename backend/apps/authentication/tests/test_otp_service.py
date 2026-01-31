import time
from unittest.mock import patch

from apps.authentication.services.otp_service import (OTP_REQUEST_LIMIT,
                                                      clear_code,
                                                      generate_code, get_code,
                                                      increment_attempts,
                                                      rate_limit_request,
                                                      store_code)
from django.test import TestCase, override_settings


@override_settings(
    CACHES={
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        }
    }
)
class OtpServiceTests(TestCase):
    def test_store_and_get_code(self):
        email = "user@example.com"
        code = generate_code()
        store_code(email, code)

        data = get_code(email)

        self.assertIsNotNone(data)
        data = data or {}
        self.assertEqual(data["code"], code)

    def test_increment_attempts(self):
        email = "user@example.com"
        store_code(email, "123456")

        data = increment_attempts(email)
        self.assertIsNotNone(data)
        data = data or {}
        self.assertEqual(data["attempts"], 1)

        data = increment_attempts(email)
        self.assertIsNotNone(data)
        data = data or {}
        self.assertEqual(data["attempts"], 2)

        clear_code(email)

    def test_rate_limit_request(self):
        email = "rate-limit@example.com"

        limited = False
        for _ in range(OTP_REQUEST_LIMIT + 1):
            limited = rate_limit_request(email)

        self.assertTrue(limited)

    def test_rate_limit_request_resets(self):
        email = "rate-limit-reset@example.com"
        with patch("apps.authentication.services.otp_service.OTP_REQUEST_LIMIT", 1), patch(
            "apps.authentication.services.otp_service.OTP_REQUEST_TTL_SECONDS", 1
        ):
            self.assertFalse(rate_limit_request(email))
            self.assertTrue(rate_limit_request(email))
            time.sleep(1.1)
            self.assertFalse(rate_limit_request(email))
