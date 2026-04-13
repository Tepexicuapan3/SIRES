#!/bin/sh
set -eu

python - <<'PY'
import os
import time
import psycopg2

host = os.getenv("DB_HOST", "auth-db")
port = int(os.getenv("DB_PORT", "5432"))
user = os.getenv("DB_USER", "sisem_auth")
password = os.getenv("DB_PASSWORD", "sisem_auth_dev_password")
database = os.getenv("DB_NAME", "sisem_auth")

def connect():
    conn = psycopg2.connect(
        host=host,
        port=port,
        user=user,
        password=password,
        dbname=database,
        connect_timeout=5,
    )
    conn.close()

for _ in range(60):
    try:
        connect()
        break
    except Exception:
        time.sleep(2)
else:
    raise SystemExit("DB not ready")
PY

python manage.py migrate

if [ "${RUN_SEED_ON_BOOT:-true}" = "true" ]; then
  python manage.py shell -c "import seed_e2e; seed_e2e.run()"
fi

exec env DJANGO_SETTINGS_MODULE=config.settings daphne -b 0.0.0.0 -p 5000 config.asgi:application
