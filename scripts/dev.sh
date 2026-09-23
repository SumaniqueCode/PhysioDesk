#!/usr/bin/env bash
# Run the backend and frontend together; Ctrl+C stops both.
# Usage: bash scripts/dev.sh  (run scripts/setup.sh first)
set -uo pipefail

cd "$(dirname "$0")/.."
ROOT="$(pwd)"

if command -v docker >/dev/null; then
  docker compose up -d --wait db
else
  echo "Docker not found; ensure PostgreSQL is running on the configured port."
fi

cd "$ROOT/backend"
if [ -x .venv/bin/python ]; then VENV_PY=".venv/bin/python"; else VENV_PY=".venv/Scripts/python.exe"; fi
[ -x "$VENV_PY" ] || { echo "Backend venv missing — run scripts/setup.sh first." >&2; exit 1; }
"$VENV_PY" -m uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!

cd "$ROOT/frontend"
[ -d node_modules ] || { echo "Frontend deps missing — run scripts/setup.sh first." >&2; kill "$BACKEND_PID" 2>/dev/null; exit 1; }
npm run dev &
FRONTEND_PID=$!

cleanup() { echo; echo "Stopping..."; kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null; }
trap cleanup INT TERM

echo ""
echo "Backend  http://localhost:8000/docs"
echo "Frontend http://localhost:3000"
echo "Press Ctrl+C to stop both."
wait
