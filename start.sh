#!/usr/bin/env bash
# Jarvis Linux launcher. Keeps both local services attached to this terminal so
# Ctrl+C stops them cleanly.
set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

export JARVIS_PROJECTS_ROOT="${JARVIS_PROJECTS_ROOT:-$HOME/projects}"
mkdir -p "$JARVIS_PROJECTS_ROOT"

command -v node >/dev/null || { echo "Node.js 20+ is required. Install Node.js, then retry."; exit 1; }
command -v npm >/dev/null || { echo "npm is required. Install Node.js/npm, then retry."; exit 1; }

if [[ ! -d orchestrator/node_modules ]]; then npm --prefix orchestrator install; fi
if [[ ! -d frontend/node_modules ]]; then npm --prefix frontend install; fi

cleanup() {
  [[ -n "${ORCHESTRATOR_PID:-}" ]] && kill "$ORCHESTRATOR_PID" 2>/dev/null || true
  [[ -n "${FRONTEND_PID:-}" ]] && kill "$FRONTEND_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "Jarvis projects root: $JARVIS_PROJECTS_ROOT"
echo "Starting orchestrator: http://127.0.0.1:3030"
npm --prefix orchestrator start & ORCHESTRATOR_PID=$!

echo "Starting frontend:     http://127.0.0.1:5173"
npm --prefix frontend run dev -- --host 127.0.0.1 & FRONTEND_PID=$!

sleep 3
if command -v xdg-open >/dev/null; then xdg-open http://127.0.0.1:5173 >/dev/null 2>&1 || true; fi

echo "Jarvis is running. Press Ctrl+C to stop."
wait "$ORCHESTRATOR_PID" "$FRONTEND_PID"
