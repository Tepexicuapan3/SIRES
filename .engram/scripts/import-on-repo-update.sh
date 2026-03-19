#!/usr/bin/env bash

set -eu

if ! command -v engram >/dev/null 2>&1; then
  exit 0
fi

if ! command -v git >/dev/null 2>&1; then
  exit 0
fi

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  exit 0
fi

engram sync --import >/dev/null
