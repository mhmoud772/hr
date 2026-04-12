$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$python = Join-Path $root ".venv\\Scripts\\python.exe"
$dbPath = Join-Path $root "run-local.sqlite3"
$analyticalDbPath = Join-Path $root "analytical.sqlite3"

if (-not (Test-Path $python)) {
    throw "Python virtual environment not found at $python"
}

Write-Host "Preparing local runtime database at $dbPath" -ForegroundColor Cyan

if (Test-Path $dbPath) {
    Remove-Item -LiteralPath $dbPath -Force
}

if (Test-Path $analyticalDbPath) {
    Remove-Item -LiteralPath $analyticalDbPath -Force
}

$env:DB_ENGINE = "sqlite"
$env:SQLITE_DB_NAME = $dbPath
$env:DJANGO_SECRET_KEY = "local-dev-secret-key-1234567890-abcdefghijklmnopqrstuvwxyz"
$env:DJANGO_DEBUG = "true"
$env:DJANGO_FORCE_MEMORY_INFRA = "true"

Push-Location $root
try {
    Write-Host "Running migrations for Default (OLTP) database..." -ForegroundColor Cyan
    & $python manage.py migrate
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    Write-Host "Running migrations for Analytical (OLAP) database..." -ForegroundColor Cyan
    & $python manage.py migrate --database=analytical
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    Write-Host "Seeding demo data..." -ForegroundColor Cyan
    & $python manage.py seed_demo
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    Write-Host "Running initial ETL to populate analytical store..." -ForegroundColor Cyan
    & $python manage.py run_etl_pipeline
    if ($LASTEXITCODE -ne 0) { 
        Write-Host "Warning: ETL failed, but continuing..." -ForegroundColor Yellow
    }

    Write-Host "Generating OpenAPI schema..." -ForegroundColor Cyan
    & $python manage.py spectacular --file schema.yml
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    Write-Host "`nLocal runtime environment is ready!" -ForegroundColor Green
    Write-Host "--------------------------------------"
    Write-Host "Main Database:       $dbPath"
    Write-Host "Analytical Database: $analyticalDbPath"
    Write-Host "Demo user:           admin / admin123"
    Write-Host "--------------------------------------"
}
finally {
    Pop-Location
}
