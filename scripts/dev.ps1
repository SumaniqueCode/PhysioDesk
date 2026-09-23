# Run the backend and frontend together, each in its own window.
# Usage: ./scripts/dev.ps1  (run ./scripts/setup.ps1 first)
$ErrorActionPreference = "Stop"

Set-Location (Join-Path $PSScriptRoot "..")
$root = Get-Location

if (Get-Command docker -ErrorAction SilentlyContinue) {
  docker compose up -d --wait db
} else {
  Write-Host "Docker not found; ensure PostgreSQL is running on the configured port." -ForegroundColor Yellow
}

$backend = Join-Path $root "backend"
$frontend = Join-Path $root "frontend"
if (-not (Test-Path (Join-Path $backend ".venv\Scripts\python.exe"))) { Write-Host "Backend venv missing — run ./scripts/setup.ps1 first." -ForegroundColor Red; exit 1 }
if (-not (Test-Path (Join-Path $frontend "node_modules")))            { Write-Host "Frontend deps missing — run ./scripts/setup.ps1 first." -ForegroundColor Red; exit 1 }

# Prefer PowerShell 7 (pwsh) if present, else Windows PowerShell.
$shell = if (Get-Command pwsh -ErrorAction SilentlyContinue) { "pwsh" } else { "powershell" }

Write-Host "Starting backend and frontend in separate windows..." -ForegroundColor Blue
Start-Process $shell -ArgumentList "-NoExit","-Command","Set-Location '$backend'; .\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000"
Start-Process $shell -ArgumentList "-NoExit","-Command","Set-Location '$frontend'; npm run dev"

Write-Host "`nBackend  http://localhost:8000/docs"
Write-Host "Frontend http://localhost:3000"
Write-Host "Two windows opened. Close them to stop the servers."
