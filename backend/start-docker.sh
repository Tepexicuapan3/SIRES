#!/bin/sh
set -e

python - <<'PY'
import os
import time
import pymysql

host = os.getenv("DB_HOST", "mysql")
port = int(os.getenv("DB_PORT", "3306"))
user = os.getenv("DB_USER", "sires")
password = os.getenv("DB_PASSWORD", "sires_dev_password")
database = os.getenv("DB_NAME", "sires")

def connect():
    conn = pymysql.connect(
        host=host,
        port=port,
        user=user,
        password=password,
        database=database,
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

exec env DJANGO_SETTINGS_MODULE=config.settings daphne -b 0.0.0.0 -p 5000 config.asgi:application
