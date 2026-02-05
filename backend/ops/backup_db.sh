#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/opt/hr-companion/backups}"
BACKUP_KEEP="${BACKUP_KEEP:-7}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
FILENAME="hr-db-${TIMESTAMP}.dump"
ARCHIVE="${FILENAME}.gz"

mkdir -p "${BACKUP_DIR}"

PGHOST="${POSTGRES_HOST:-localhost}"
PGPORT="${POSTGRES_PORT:-5432}"
PGUSER="${POSTGRES_USER:-hr_user}"
PGPASSWORD="${POSTGRES_PASSWORD:-}"
export PGPASSWORD

pg_dump -Fc -h "${PGHOST}" -p "${PGPORT}" -U "${PGUSER}" "${POSTGRES_DB:-hr_db}" > "${BACKUP_DIR}/${FILENAME}"
gzip -9 "${BACKUP_DIR}/${FILENAME}"
echo "Backup created: ${BACKUP_DIR}/${ARCHIVE}"

if [ "${BACKUP_KEEP}" -gt 0 ]; then
  ls -1t "${BACKUP_DIR}"/hr-db-*.dump.gz 2>/dev/null | tail -n +"$((BACKUP_KEEP + 1))" | xargs -r rm -f
fi
