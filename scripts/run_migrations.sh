#!/usr/bin/env bash
# Run migrations against DATABASE_URL (Postgres)
# Usage: ./scripts/run_migrations.sh

set -e
if [ -z "$DATABASE_URL" ]; then
  echo "DATABASE_URL not set. Skipping migrations."
  exit 0
fi

echo "Running SQL migrations from migrations/*.sql against $DATABASE_URL"
for f in migrations/*.sql; do
  echo "Applying $f"
  psql "$DATABASE_URL" -f "$f"
done

echo "Migrations applied."