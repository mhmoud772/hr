#!/bin/bash
set -e

if [ -n "$ANALYTICAL_DB_NAME" ]; then
    echo "Creating additional database '$ANALYTICAL_DB_NAME'..."
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
	    CREATE DATABASE "$ANALYTICAL_DB_NAME";
	    GRANT ALL PRIVILEGES ON DATABASE "$ANALYTICAL_DB_NAME" TO "$POSTGRES_USER";
EOSQL
    echo "Database '$ANALYTICAL_DB_NAME' created."
else
    echo "Skipping analytical database creation because ANALYTICAL_DB_NAME is not set."
fi
