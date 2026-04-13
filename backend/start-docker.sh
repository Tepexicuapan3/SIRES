#!/bin/sh
set -eu

python -m scripts.wait_for_db

python manage.py migrate

if [ "${RUN_SEED_ON_BOOT:-true}" = "true" ]; then
  python manage.py seed_auth_access --base --quiet
fi

exec env DJANGO_SETTINGS_MODULE=config.settings daphne -b 0.0.0.0 -p 5000 config.asgi:application
