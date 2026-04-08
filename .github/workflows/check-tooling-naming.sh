#!/usr/bin/env bash
set -euo pipefail

CI_FILE=".github/workflows/ci.yml"
COMPOSE_FILE="docker-compose.yml"

echo "[check] CI frontend app name uses SISEM"
grep -qE 'VITE_APP_NAME:\s*SISEM' "$CI_FILE"

echo "[check] Docker Compose frontend default app name uses SISEM"
grep -qE 'VITE_APP_NAME:\s*\$\{VITE_APP_NAME:-SISEM\}' "$COMPOSE_FILE"

echo "[check] Docker Compose defines SISEM preferred login URL"
grep -qE 'SISEM_LOGIN_URL:\s*\$\{SISEM_LOGIN_URL:-\$\{SIRES_LOGIN_URL:-http://localhost:5173/login\}\}' "$COMPOSE_FILE"

echo "[check] Docker Compose defines legacy SIRES login URL alias"
grep -qE 'SIRES_LOGIN_URL:\s*\$\{SIRES_LOGIN_URL:-\$\{SISEM_LOGIN_URL:-http://localhost:5173/login\}\}' "$COMPOSE_FILE"

echo "[check] Docker Compose defines SISEM preferred support email"
grep -qE 'SISEM_SUPPORT_EMAIL:\s*\$\{SISEM_SUPPORT_EMAIL:-\$\{SIRES_SUPPORT_EMAIL:-soporte@sisem.local\}\}' "$COMPOSE_FILE"

echo "[check] Docker Compose defines legacy SIRES support email alias"
grep -qE 'SIRES_SUPPORT_EMAIL:\s*\$\{SIRES_SUPPORT_EMAIL:-\$\{SISEM_SUPPORT_EMAIL:-soporte@sisem.local\}\}' "$COMPOSE_FILE"

echo "All tooling naming compatibility checks passed."
