# HR Companion

A modern Human Resources management system based on a **Modular Monolith** architecture.

## 📚 Project Documentation
- **[Architecture & Design (Arabic)](file:///d:/hr-companion-main/ARCHITECTURE_AR.md)**: Detailed modular boundaries and core roles.
- **[Data Contracts & schema (Technical)](file:///d:/hr-companion-main/DATA_CONTRACTS.md)**: OLTP to OLAP transition and and data exit.
- **[AI Readiness Guide (Operational)](file:///d:/hr-companion-main/AI_READINESS.md)**: Guidelines for safe AI interaction and service layer patterns.

## 🏗️ Project Structure
- `frontend/`: Vite + React + Shadcn UI
- `backend/apps/`: Modular domain logic (employees, attendance, devices, etc.)
- `backend/shared/`: Cross-app utilities and infrastructure.
- `backend/scripts/`: Local dev and and CI automation.

## Prerequisites
- Node.js 18+
- Python 3.10+
- PostgreSQL
- Redis (required for Celery background jobs)

## Environment Variables
The backend loads `backend/.env` automatically via `python-dotenv`.

- Backend: create `backend/.env` from `backend/.env.example`.
- Frontend: create `frontend/.env` from `frontend/.env.example` and set `VITE_API_URL`.

## Database Setup (PostgreSQL)
Create the database and user (adjust values to match `backend/.env`):

```sql
CREATE USER hr_user WITH PASSWORD 'hr_password';
CREATE DATABASE hr_db OWNER hr_user;
GRANT ALL PRIVILEGES ON DATABASE hr_db TO hr_user;
```

## Quick Start (Backend)
```bash
cd backend
python -m venv .venv
# Activate your virtualenv, then:
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### Celery Worker (optional in local, required in production)
Run in a second terminal when you want async tasks (device sync, queued emails):
```bash
cd backend
celery -A config worker -l info
```
If Redis is not running locally, set `CELERY_TASK_ALWAYS_EAGER=true` in `backend/.env` for synchronous fallback.

### ZKTeco device control (new)
- Install backend deps (includes `pyzkaccess`) and ensure devices allow TCP port `4370` with the correct Comm Key.
- API endpoints on `/api/devices/{id}/`:
  - `POST sync/` → يجلب سجلات الحضور مباشرة من الجهاز ويحدث الحالة.
  - `POST sync-time/` → يضبط ساعة الجهاز على وقت الخادم.
  - `POST reboot/` → يعيد تشغيل الجهاز.
  - `POST pull-logs/` (اختياري `limit`) → يسحب السجلات دون تشغيل مزامنة كاملة.
  - `POST push-employee/` مع `employeeCode` → يدفع المستخدم إلى الجهاز.
- أوصل الخادم بالأجهزة عبر شبكة داخلية/VPN؛ لا تفتح المنفذ 4370 على الإنترنت.

### Advanced Device Control (new)
- Device groups: `/api/device-groups/`
- Device policies: `/api/device-policies/` and apply with `/api/device-policies/{id}/apply/`
- Template registry and distribution: `/api/device-templates/` and `/api/device-templates/{id}/distribute/`
- Command approvals: `/api/device-command-approvals/` with approve/reject actions
- Command center queue/catalog/dashboard:
  - `/api/device-command-center/catalog/`
  - `/api/device-command-center/queue/`
  - `/api/device-command-center/dashboard/`
- Firmware rollout orchestration: `/api/device-firmware-rollouts/` + `/start/` + `/report/`
- Device backups/restores: `/api/device-backups/` + `/restore/`

## Quick Start (Frontend)
```bash
cd frontend
npm install
npm run dev
```

## API Docs
- Swagger UI: `/api/docs/`
- Schema: `/api/schema/`

## Production (EC2)
1. Create `backend/.env` from `backend/.env.example` and fill in:
   - `DJANGO_SECRET_KEY`, `DJANGO_ALLOWED_HOSTS`, `POSTGRES_*`
   - `FRONTEND_URL`, `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS`
   - `SENDGRID_API_KEY` (for email)
2. Set `DJANGO_DEBUG=false` and `DJANGO_ALLOWED_HOSTS` to your EC2 public IP.
3. For now (no domain/SSL): keep `DJANGO_USE_HTTPS=false`.
4. Run migrations and start the backend with a production server (Gunicorn).

### EC2 + Nginx + systemd (no SSL yet)
Paths below assume:
- Code is in `/opt/hr-companion`
- Backend venv at `/opt/hr-companion/backend/.venv`
- Frontend build at `/opt/hr-companion/frontend/dist`

1. Provision EC2 (Ubuntu 22.04) and install packages:
```bash
sudo apt update
sudo apt install -y python3-venv python3-pip nginx postgresql-client
```

2. Backend setup:
```bash
cd /opt/hr-companion/backend
python3 -m venv .venv
./.venv/bin/pip install -r requirements.txt
cp .env.example .env
# Edit .env with your production values
./.venv/bin/python manage.py migrate
./.venv/bin/python manage.py collectstatic --noinput
```

3. Frontend build:
```bash
cd /opt/hr-companion/frontend
npm install
npm run build
```

4. Nginx:
```bash
sudo cp /opt/hr-companion/backend/ops/nginx-hr-companion.conf /etc/nginx/sites-available/hr-companion
sudo ln -s /etc/nginx/sites-available/hr-companion /etc/nginx/sites-enabled/hr-companion
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

5. systemd service:
```bash
sudo cp /opt/hr-companion/backend/ops/hr-backend.service /etc/systemd/system/hr-backend.service
sudo systemctl daemon-reload
sudo systemctl enable hr-backend
sudo systemctl start hr-backend
sudo systemctl status hr-backend --no-pager
```

6. Update firewall / security group:
- Allow inbound `80` (HTTP) and `22` (SSH).
- Allow `8000` only if you want to hit Gunicorn directly (not recommended).

## Backups (PostgreSQL)
Scripts:
- `backend/ops/backup_db.sh`
- `backend/ops/restore_db.sh`

Example:
```bash
cd /opt/hr-companion/backend
chmod +x ops/backup_db.sh ops/restore_db.sh
BACKUP_DIR=/opt/hr-companion/backups ./ops/backup_db.sh
./ops/restore_db.sh /opt/hr-companion/backups/hr-db-YYYYMMDD-HHMMSS.dump
```

## Quality Checks
For a full suite of automated checks (Backend + Frontend), run:
```powershell
backend/scripts/run_local_ci.ps1
```

Individual Backend checks:
```bash
cd backend
chmod +x ops/run_checks.sh
./ops/run_checks.sh
```
Individual Frontend checks:
```bash
cd frontend
chmod +x ops/run_checks.sh
./ops/run_checks.sh
```

## Production Docker Compose
Use `docker-compose.prod.yml` with a `.env` file at the repo root:
```bash
cp backend/.env.example .env
# Fill .env values (DB, SendGrid, Sentry, etc.)
docker compose -f docker-compose.prod.yml up -d --build
```
`docker-compose.prod.yml` now includes both `redis` and `celery-worker` services, so queued tasks run automatically.

## Push Images To Docker Hub
This repo includes a helper script for publishing backend/frontend images:

```bash
powershell -ExecutionPolicy Bypass -File tools/push-dockerhub.ps1 -DockerHubUsername <dockerhub_user> -Tag v1.0.0 -ApiUrl https://your-domain/api -PushLatest
```

Notes:
- Start Docker Desktop (Docker Engine must be running).
- Login first with `docker login`, or set `DOCKERHUB_TOKEN` to let the script log in automatically.
- Images pushed:
  - `<dockerhub_user>/hr-backend:<tag>`
  - `<dockerhub_user>/hr-frontend:<tag>`

For release deployment, `docker-compose.release.yml` supports:
- `DOCKERHUB_USERNAME` (default: `admin1ede`)
- `IMAGE_TAG` (default: `latest`)

## Deploy From Docker Hub On Server
1. Copy deployment files to the server (or clone the repo).
2. Create server env file from template:
```bash
cp release.env.example .env
```
3. Edit `.env` with real values (domain, secrets, DB password, Docker Hub username/tag).
4. Start services from Docker Hub images:
```bash
docker compose --env-file .env -f docker-compose.release.yml pull
docker compose --env-file .env -f docker-compose.release.yml up -d
```
5. Verify:
```bash
docker compose --env-file .env -f docker-compose.release.yml ps
docker compose --env-file .env -f docker-compose.release.yml logs -f backend
```

### Sentry
Set `SENTRY_DSN`, `SENTRY_ENV`, `SENTRY_TRACES_SAMPLE_RATE` in `.env`.

### Healthchecks.io (optional)
Set `HEALTHCHECKS_URL` to your ping URL. The backend will send a ping on startup.

---

## ملاحظات بالعربية
- الواجهة الأمامية موجودة داخل `frontend/` والخلفية داخل `backend/`.
- تأكد من إعداد PostgreSQL وتعبئة ملف `backend/.env`.
- لتشغيل الخلفية: `python manage.py migrate` ثم `python manage.py runserver`.
- لتشغيل الواجهة: `npm install` ثم `npm run dev`.
