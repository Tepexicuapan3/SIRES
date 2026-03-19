#!/usr/bin/env bash

set -eu

if [ "${ENGRAM_SYNC_DISABLE:-0}" = "1" ]; then
  exit 0
fi

if ! command -v engram >/dev/null 2>&1; then
  exit 0
fi

if ! command -v git >/dev/null 2>&1; then
  exit 0
fi

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  exit 0
fi

ROOT_DIR="$(git rev-parse --show-toplevel)"
cd "$ROOT_DIR"

PROJECT_NAME="${ENGRAM_SHARED_PROJECT_NAME:-SIRES_SHARED}"

if ! engram sync --project "$PROJECT_NAME" >/dev/null 2>&1; then
  exit 0
fi

if [ -d ".engram/chunks" ]; then
  git add .engram/manifest.json .engram/chunks/*.jsonl.gz 2>/dev/null || true
fi
