#!/usr/bin/env bash
# One-time setup after cloning: start the database, then install, migrate and seed.
# Usage: bash scripts/setup.sh
set -euo pipefail

cd "$(dirname "$0")/.."
ROOT="$(pwd)"

info() { printf "\n\033[1;34m==>\033[0m %s\n" "$1"; }
die()  { printf "\n\033[1;31mError:\033[0m %s\n" "$1" >&2; exit 1; }

PYTHON="$(command -v python3 || command -v python || true)"
[ -n "$PYTHON" ]              || die "Python 3.12+ is required but was not found."
command -v node   >/dev/null  || die "Node.js 20+ is required but was not found."
command -v npm    >/dev/null  || die "npm is required but was not found."
command -v docker >/dev/null  || die "Docker is required to run PostgreSQL (docker compose)."

info "Database — starting PostgreSQL via docker compose"
[ -f .env ] || cp .env.example .env
docker compose up -d --wait db

info "Backend — virtualenv and dependencies"
cd "$ROOT/backend"
[ -d .venv ] || "$PYTHON" -m venv .venv
# venv layout differs between Unix (bin) and Windows/Git-Bash (Scripts).
if [ -x .venv/bin/python ]; then VENV_PY=".venv/bin/python"; else VENV_PY=".venv/Scripts/python.exe"; fi
"$VENV_PY" -m pip install --quiet --upgrade pip
"$VENV_PY" -m pip install --quiet -e ".[dev]"

if [ ! -f .env ]; then
  info "Backend — creating .env with a generated JWT secret"
  cp .env.example .env
  "$VENV_PY" - <<'PY'
import pathlib, re, secrets
p = pathlib.Path(".env")
p.write_text(re.sub(r"^JWT_SECRET=.*$", f"JWT_SECRET={secrets.token_urlsafe(48)}",
                    p.read_text(), flags=re.M))
PY
fi

info "Backend — applying migrations"
"$VENV_PY" -m alembic upgrade head

info "Backend — seeding test users"
"$VENV_PY" -m scripts.seed

info "Frontend — installing dependencies"
cd "$ROOT/frontend"
npm install --no-fund --no-audit

info "Setup complete."
cat <<'EOF'

Test credentials (from the seed):
  Admin  admin@physiodesk.com  Admin@123
  Staff  staff@physiodesk.com  Staff@123

Start both servers with:  bash scripts/dev.sh
  Frontend  http://localhost:3000
  Backend   http://localhost:8000  (Swagger at /docs)
EOF
