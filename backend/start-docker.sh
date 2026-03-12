#!/bin/sh
set -e

unset http_proxy https_proxy no_proxy HTTP_PROXY HTTPS_PROXY NO_PROXY

if [ -z "${DB_HOST:-}" ] || [ "${DB_HOST}" = "127.0.0.1" ] || [ "${DB_HOST}" = "localhost" ]; then
  export DB_HOST="host.docker.internal"
fi

python - <<'PY'
import os
import time

import psycopg2

host = os.getenv("DB_HOST", "host.docker.internal")
port = int(os.getenv("DB_PORT", "5432"))
user = os.getenv("DB_USER", "sires")
password = os.getenv("DB_PASSWORD", "112233")
database = os.getenv("DB_NAME", "sires")

for _ in range(60):
    try:
        conn = psycopg2.connect(
            host=host,
            port=port,
            user=user,
            password=password,
            dbname=database,
        )
        conn.close()
        break
    except Exception:
        time.sleep(2)
else:
    raise SystemExit("DB not ready")
PY

python manage.py migrate

if [ "${AUTO_RUN_SEED:-false}" = "true" ]; then
  if ! python manage.py shell -c "import seed_e2e; seed_e2e.run()"; then
    echo "[WARN] seed_e2e failed, continuing startup"
  fi
fi

if ! python -c "import importlib.util,sys; sys.exit(0 if importlib.util.find_spec('daphne') else 1)"; then
  pip install --no-cache-dir daphne==4.1.2
fi

DJANGO_SETTINGS_MODULE=config.settings daphne -b 0.0.0.0 -p 5000 config.asgi:application
