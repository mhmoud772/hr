#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 /path/to/backup.dump[.gz]"
  exit 1
fi

BACKUP_FILE="$1"

PGHOST="${POSTGRES_HOST:-localhost}"
PGPORT="${POSTGRES_PORT:-5432}"
PGUSER="${POSTGRES_USER:-hr_user}"
PGPASSWORD="${POSTGRES_PASSWORD:-}"
export PGPASSWORD

if [[ "${BACKUP_FILE}" == *.gz ]]; then
  TMP_FILE="$(mktemp)"
  gunzip -c "${BACKUP_FILE}" > "${TMP_FILE}"
  pg_restore -c -h "${PGHOST}" -p "${PGPORT}" -U "${PGUSER}" -d "${POSTGRES_DB:-hr_db}" "${TMP_FILE}"
  rm -f "${TMP_FILE}"
else
  pg_restore -c -h "${PGHOST}" -p "${PGPORT}" -U "${PGUSER}" -d "${POSTGRES_DB:-hr_db}" "${BACKUP_FILE}"
fi
echo "Restore completed: ${BACKUP_FILE}"
