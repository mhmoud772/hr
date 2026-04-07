#!/usr/bin/env bash
set -e

python - <<'PY'
import os
import time
import psycopg2

host = os.getenv("POSTGRES_HOST", "db")
port = int(os.getenv("POSTGRES_PORT", "5432"))
db = os.getenv("POSTGRES_DB", "hr_db")
user = os.getenv("POSTGRES_USER", "hr_user")
password = os.getenv("POSTGRES_PASSWORD", "hr_password")

for _ in range(30):
    try:
        conn = psycopg2.connect(
            host=host,
            port=port,
            dbname=db,
            user=user,
            password=password,
        )
        conn.close()
        break
    except Exception:
        time.sleep(2)
else:
    raise SystemExit("Postgres not ready")
PY

python manage.py migrate --noinput
python manage.py collectstatic --noinput || true

python - <<'PY'
import os
import urllib.request

url = os.getenv("HEALTHCHECKS_URL")
if url:
    try:
        urllib.request.urlopen(url, timeout=5)
        print("Healthchecks ping sent")
    except Exception as exc:
        print(f"Healthchecks ping failed: {exc}")
PY

exec daphne -b 0.0.0.0 -p 8000 config.asgi:application
