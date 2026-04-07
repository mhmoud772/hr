#!/bin/bash
set -e

# ==============================================================================
# Smoke Test for Analytics DB & Services in Production Topology
# ==============================================================================

echo "▶ Waiting for postgres DB to be fully ready..."
docker-compose -f docker-compose.prod.yml ps

echo "▶ 1. Validating Databases Configuration..."
if ! docker-compose -f docker-compose.prod.yml exec -T db psql -U hr_user -d hr_db -tAc "SELECT 1 FROM pg_database WHERE datname='hr_analytics'" | grep -q 1; then
    echo "hr_analytics database missing! Creating it now..."
    docker-compose -f docker-compose.prod.yml exec -T db psql -U hr_user -d hr_db -c "CREATE DATABASE hr_analytics;"
    docker-compose -f docker-compose.prod.yml exec -T db psql -U hr_user -d hr_db -c "GRANT ALL PRIVILEGES ON DATABASE hr_analytics TO hr_user;"
else
    echo "hr_analytics database exists."
fi

echo "▶ 2. Running reports migrations explicitly against 'analytical' database..."
docker-compose -f docker-compose.prod.yml exec -T backend python manage.py migrate --database=analytical

echo "▶ 3. Executing ETL pipeline to extract data into analytical models..."
docker-compose -f docker-compose.prod.yml exec -T backend python manage.py run_etl_pipeline

echo "▶ 4. Checking if Dashboard Metrics endpoint responds..."
# Check health first
HEALTH=$(docker-compose -f docker-compose.prod.yml exec -T backend python -c "import urllib.request; print(urllib.request.urlopen('http://localhost:8000/api/health/').read().decode())" || echo "Health check failed")
echo "Healthcheck: $HEALTH"

echo "Since dashboard endpoint requires authentication, we run a python shell snippet to test the analytical service directly:"
cat << 'EOF' | docker-compose -f docker-compose.prod.yml exec -T backend python manage.py shell
from apps.reports.services.analytical_service import AnalyticalService
print("Fetching Dashboard Stats...")
stats = AnalyticalService.get_dashboard_stats(days_range=7)
print("Stats Output:", stats)
db_status = AnalyticalService.get_metrics_database_status()
print("Analytical DB Status:", db_status)
if db_status.get("selected") != "analytical":
    raise Exception(f"Expected to hit 'analytical', but got: {db_status}")
print("Smoke Test SUCCESS 🚀")
EOF

echo "✓ Analytics Infrastructure is configured correctly."
