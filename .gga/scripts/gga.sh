#!/usr/bin/env bash

set -eu

if ! command -v gga >/dev/null 2>&1; then
  echo "Error: gga no esta instalado." >&2
  exit 1
fi

ROOT_DIR="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
CONFIG_FILE="$ROOT_DIR/.gga/gga/config"

if [ ! -f "$CONFIG_FILE" ]; then
  echo "Error: falta config de GGA en $CONFIG_FILE" >&2
  exit 1
fi

export XDG_CONFIG_HOME="$ROOT_DIR/.gga"

exec gga "$@"
