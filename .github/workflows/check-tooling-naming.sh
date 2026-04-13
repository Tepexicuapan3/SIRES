#!/usr/bin/env bash
set -euo pipefail

CI_FILE=".github/workflows/ci.yml"
COMPOSE_FILE="docker-compose.yml"

echo "[check] CI frontend app name uses SISEM"
grep -qE 'VITE_APP_NAME:\s*SISEM' "$CI_FILE"

echo "[check] Docker Compose frontend default app name uses SISEM"
grep -qE 'VITE_APP_NAME:\s*\$\{VITE_APP_NAME:-SISEM\}' "$COMPOSE_FILE"

echo "[check] Docker Compose defines SISEM login URL"
grep -qE 'SISEM_LOGIN_URL:\s*\$\{SISEM_LOGIN_URL:-http://localhost:5173/login\}' "$COMPOSE_FILE"

echo "[check] Docker Compose defines SISEM support email"
grep -qE 'SISEM_SUPPORT_EMAIL:\s*\$\{SISEM_SUPPORT_EMAIL:-soporte@sisem.local\}' "$COMPOSE_FILE"

echo "All tooling naming compatibility checks passed."
