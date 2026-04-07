# Scripts/generate_types.ps1
# Generates TypeScript types from Django OpenAPI schema

# 1. Export OpenAPI schema from Django
Write-Host "Exporting OpenAPI schema from Django..." -ForegroundColor Cyan
python manage.py spectacular --file schema.yml

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to export schema." -ForegroundColor Red
    exit 1
}

# 2. Convert YAML to TypeScript (Assumes openapi-typescript is installed in frontend)
Write-Host "Generating TypeScript types..." -ForegroundColor Cyan
npx openapi-typescript schema.yml -o ../frontend/src/types/api.generated.ts

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to generate types. Make sure openapi-typescript is installed." -ForegroundColor Red
    exit 1
}

# 3. Cleanup
Remove-Item schema.yml
Write-Host "Success! Types generated in frontend/src/types/api.generated.ts" -ForegroundColor Green
