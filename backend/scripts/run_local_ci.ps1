$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$python = Join-Path $root ".venv\\Scripts\\python.exe"
$frontendRoot = Join-Path (Split-Path -Parent $root) "frontend"
$tempDb = Join-Path $env:TEMP "hr-companion-ci.sqlite3"

if (-not (Test-Path $python)) {
    throw "Python virtual environment not found at $python"
}

if (Test-Path $tempDb) {
    Remove-Item -LiteralPath $tempDb -Force
}

$env:DB_ENGINE = "sqlite"
$env:SQLITE_DB_NAME = $tempDb
$env:DJANGO_SECRET_KEY = "ci-secret-key-1234567890-abcdefghijklmnopqrstuvwxyz"
$env:DJANGO_DEBUG = "false"
$env:DJANGO_ALLOWED_HOSTS = "localhost,127.0.0.1"
$env:DJANGO_FORCE_MEMORY_INFRA = "true"
$env:REDIS_CACHE_URL = "redis://localhost:6379/0"
$env:CELERY_TASK_ALWAYS_EAGER = "true"

Push-Location $root
try {
    Write-Host "Checking for unmade migrations..." -ForegroundColor Cyan
    & $python manage.py makemigrations --check --dry-run
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    Write-Host "Running Backend Linting..." -ForegroundColor Cyan
    & "$root\\.venv\\Scripts\\flake8.exe" . --count --select=E9,F63,F7,F82 --show-source --statistics
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    Write-Host "Running Backend Tests (All Modular Apps)..." -ForegroundColor Cyan
    & $python manage.py test apps
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    Write-Host "Verifying OpenAPI Schema Generation..." -ForegroundColor Cyan
    # Ensure schema can be generated without errors
    & $python manage.py spectacular --file schema.yml
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
finally {
    Pop-Location
}

Push-Location $frontendRoot
try {
    npm run lint
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    npm test
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    npm run build
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    npx openapi-typescript ..\\backend\\schema.yml -o src\\types\\api.generated.ts
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
finally {
    Pop-Location
}

Write-Host "Local CI checks passed." -ForegroundColor Green
