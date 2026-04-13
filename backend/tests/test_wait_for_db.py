from django.test import SimpleTestCase

from scripts.wait_for_db import DatabaseReadinessError, wait_for_database


class WaitForDatabaseTests(SimpleTestCase):
    def test_wait_for_database_retries_transient_errors_until_success(self):
        attempts = {"count": 0}

        class FakeConnection:
            def close(self):
                return None

        def fake_connect(**_kwargs):
            attempts["count"] += 1
            if attempts["count"] < 3:
                raise RuntimeError("connection refused")
            return FakeConnection()

        waits = []

        wait_for_database(
            host="auth-db",
            port=5432,
            user="postgres",
            password="secret",
            database="sires",
            attempts=5,
            delay_seconds=1,
            sleep_fn=waits.append,
            connect_fn=fake_connect,
        )

        self.assertEqual(attempts["count"], 3)
        self.assertEqual(waits, [1, 1])

    def test_wait_for_database_fails_fast_for_auth_role_errors(self):
        def fake_connect(**_kwargs):
            raise RuntimeError('FATAL: role "sires_auth" does not exist')

        waits = []

        with self.assertRaises(DatabaseReadinessError) as context:
            wait_for_database(
                host="auth-db",
                port=5432,
                user="sires_auth",
                password="secret",
                database="sires_auth",
                attempts=5,
                delay_seconds=1,
                sleep_fn=waits.append,
                connect_fn=fake_connect,
            )

        self.assertIn("non-retryable authentication/role error", str(context.exception))
        self.assertIn("AUTH_DB_USER/AUTH_DB_PASSWORD", str(context.exception))
        self.assertEqual(waits, [])

    def test_wait_for_database_reports_last_error_after_retry_window(self):
        def fake_connect(**_kwargs):
            raise RuntimeError("connection refused")

        waits = []

        with self.assertRaises(DatabaseReadinessError) as context:
            wait_for_database(
                host="auth-db",
                port=5432,
                user="postgres",
                password="secret",
                database="sires",
                attempts=3,
                delay_seconds=1,
                sleep_fn=waits.append,
                connect_fn=fake_connect,
            )

        self.assertIn("DB not ready after retry window", str(context.exception))
        self.assertIn("Last error: connection refused", str(context.exception))
        self.assertEqual(waits, [1, 1])
