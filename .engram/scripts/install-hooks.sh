#!/usr/bin/env bash

set -eu

if ! command -v git >/dev/null 2>&1; then
  echo "git no esta disponible" >&2
  exit 1
fi

ROOT_DIR="$(git rev-parse --show-toplevel)"
HOOKS_PATH="$ROOT_DIR/.githooks"

if [ ! -d "$HOOKS_PATH" ]; then
  echo "No existe $HOOKS_PATH" >&2
  exit 1
fi

chmod +x \
  "$HOOKS_PATH/pre-commit" \
  "$HOOKS_PATH/commit-msg" \
  "$HOOKS_PATH/post-merge" \
  "$HOOKS_PATH/post-checkout" \
  "$HOOKS_PATH/post-rewrite" \
  "$ROOT_DIR/.engram/scripts/export-on-commit-msg.sh" \
  "$ROOT_DIR/.engram/scripts/import-on-repo-update.sh" \
  "$ROOT_DIR/.engram/scripts/install-hooks.sh"

git -C "$ROOT_DIR" config core.hooksPath ".githooks"

echo "core.hooksPath configurado en .githooks"
echo "Hook pre-commit habilitado"
echo "Hooks listos para export/import automatico de Engram"
echo "Proyecto compartido por defecto: ${ENGRAM_SHARED_PROJECT_NAME:-SIRES_SHARED}"
