#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

run_smoke() {
  "$1" scripts/smoke_runtime_check.mjs
}

if command -v node >/dev/null 2>&1; then
  run_smoke node
  exit 0
fi

# Try Windows Node binary directly from WSL.
if [ -x "/mnt/c/Program Files/nodejs/node.exe" ]; then
  if run_smoke "/mnt/c/Program Files/nodejs/node.exe"; then
    exit 0
  fi
fi

# Fallback: run through cmd.exe in case direct node.exe invocation fails in this environment.
if command -v cmd.exe >/dev/null 2>&1; then
  WIN_ROOT="$(wslpath -w "$ROOT_DIR")"
  cmd.exe /c "cd /d \"$WIN_ROOT\" && node scripts\\smoke_runtime_check.mjs"
  exit 0
fi

echo "Node runtime is not available. Install Node or expose it in PATH."
exit 1
