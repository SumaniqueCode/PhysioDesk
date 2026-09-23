# One-time setup after cloning: start the database, then install, migrate and seed.
# Usage: ./scripts/setup.ps1
$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $true

Set-Location (Join-Path $PSScriptRoot "..")
$root = Get-Location

function Info($m) { Write-Host "`n==> $m" -ForegroundColor Blue }
function Die($m)  { Write-Host "`nError: $m" -ForegroundColor Red; exit 1 }

if (-not (Get-Command python -ErrorAction SilentlyContinue)) { Die "Python 3.12+ is required but was not found." }
if (-not (Get-Command node   -ErrorAction SilentlyContinue)) { Die "Node.js 20+ is required but was not found." }
if (-not (Get-Command npm    -ErrorAction SilentlyContinue)) { Die "npm is required but was not found." }
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { Die "Docker is required to run PostgreSQL (docker compose)." }

Info "Database — starting PostgreSQL via docker compose"
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
docker compose up -d --wait db

Info "Backend — virtualenv and dependencies"
Set-Location (Join-Path $root "backend")
if (-not (Test-Path .venv)) { python -m venv .venv }
$py = ".\.venv\Scripts\python.exe"
& $py -m pip install --quiet --upgrade pip
& $py -m pip install --quiet -e ".[dev]"

if (-not (Test-Path .env)) {
  Info "Backend — creating .env with a generated JWT secret"
  Copy-Item .env.example .env
  $secret = & $py -c "import secrets; print(secrets.token_urlsafe(48))"
  (Get-Content .env) -replace '^JWT_SECRET=.*', "JWT_SECRET=$secret" | Set-Content .env
}

Info "Backend — applying migrations"
& $py -m alembic upgrade head

Info "Backend — seeding test users"
& $py -m scripts.seed

Info "Frontend — installing dependencies"
Set-Location (Join-Path $root "frontend")
npm install --no-fund --no-audit

Info "Setup complete."
Write-Host @"

Test credentials (from the seed):
  Admin  admin@physiodesk.com  Admin@123
  Staff  staff@physiodesk.com  Staff@123

Start both servers with:  ./scripts/dev.ps1
  Frontend  http://localhost:3000
  Backend   http://localhost:8000  (Swagger at /docs)
"@
