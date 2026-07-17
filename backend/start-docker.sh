#!/bin/sh
#start-docker.sh
set -eu

python -m scripts.wait_for_db

if [ "${RUN_MIGRATE_ON_BOOT:-true}" = "true" ]; then
  python manage.py migrate
fi

if [ "${RUN_SEED_ON_BOOT:-true}" = "true" ]; then
  python manage.py seed_auth_access --base --quiet
fi

if [ "${RUN_E2E_SEED_ON_BOOT:-false}" = "true" ]; then
  echo "[BOOT][KAN-89] running seed_e2e.py at $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  python manage.py shell -c "import seed_e2e; seed_e2e.run()"
fi

exec env DJANGO_SETTINGS_MODULE=config.settings daphne -b 0.0.0.0 -p 5000 config.asgi:application
