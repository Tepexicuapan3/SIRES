import os
import time

import psycopg2


class DatabaseReadinessError(RuntimeError):
    """Raised when the database is unreachable or misconfigured."""


RETRYABLE_ERROR_HINTS = (
    "connection refused",
    "could not connect to server",
    "timeout expired",
    "temporary failure",
    "database system is starting up",
    "server closed the connection unexpectedly",
    "name or service not known",
    "could not translate host name",
    "no route to host",
)

def _is_retryable_error(error_message: str) -> bool:
    lowered = error_message.lower()
    return any(hint in lowered for hint in RETRYABLE_ERROR_HINTS)


def _is_fatal_error(error_message: str) -> bool:
    lowered = error_message.lower()
    if "password authentication failed" in lowered:
        return True
    if "role" in lowered and "does not exist" in lowered:
        return True
    if "database" in lowered and "does not exist" in lowered:
        return True
    if "no pg_hba.conf entry" in lowered:
        return True
    if "permission denied for database" in lowered:
        return True
    return False


def _connection_target(host: str, port: int, database: str, user: str) -> str:
    return f"host={host} port={port} db={database} user={user}"


def wait_for_database(
    *,
    host: str,
    port: int,
    user: str,
    password: str,
    database: str,
    attempts: int = 60,
    delay_seconds: int = 2,
    sleep_fn=time.sleep,
    connect_fn=psycopg2.connect,
) -> None:
    last_error_message = "unknown"

    for attempt in range(1, attempts + 1):
        try:
            connection = connect_fn(
                host=host,
                port=port,
                user=user,
                password=password,
                dbname=database,
                connect_timeout=5,
            )
            connection.close()
            return
        except Exception as exc:  # pragma: no cover - psycopg2 raises runtime subclasses
            error_message = str(exc)
            last_error_message = error_message

            if _is_fatal_error(error_message):
                target = _connection_target(host, port, database, user)
                raise DatabaseReadinessError(
                    "DB readiness failed with non-retryable authentication/role error. "
                    f"Target: {target}. Error: {error_message}. "
                    "If using a persisted Docker volume, verify AUTH_DB_USER/AUTH_DB_PASSWORD "
                    "and AUTH_DB_NAME match the existing PostgreSQL role/database in that volume."
                ) from exc

            if attempt < attempts and _is_retryable_error(error_message):
                sleep_fn(delay_seconds)
                continue

            if attempt < attempts:
                sleep_fn(delay_seconds)

    target = _connection_target(host, port, database, user)
    raise DatabaseReadinessError(
        "DB not ready after retry window. "
        f"Target: {target}. Last error: {last_error_message}. "
        "Check DB container health and credentials (AUTH_DB_*) for this environment."
    )


def main() -> None:
    host = os.getenv("DB_HOST", "auth-db")
    port = int(os.getenv("DB_PORT", "5432"))
    user = os.getenv("DB_USER", "sisem_auth")
    password = os.getenv("DB_PASSWORD", "sisem_auth_dev_password")
    database = os.getenv("DB_NAME", "sisem_auth")

    wait_for_database(
        host=host,
        port=port,
        user=user,
        password=password,
        database=database,
    )


if __name__ == "__main__":
    main()
