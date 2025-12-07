#!/bin/sh
set -e

echo "[entrypoint] Bắt đầu khởi động..."

DB_HOST=${DB_HOST:-mysql}
DB_PORT=${DB_PORT:-3306}

echo "[entrypoint] Đợi MySQL: ${DB_HOST}:${DB_PORT}..."
until nc -z "$DB_HOST" "$DB_PORT"; do
  sleep 3
done
echo "[entrypoint] MySQL đã sẵn sàng!"

MIGRATION_FLAG="/app/dist/.migrations_done"

if [ ! -f "$MIGRATION_FLAG" ]; then
  echo "[entrypoint] Chạy migration..."
  npm run db:migrate || true

  echo "[entrypoint] Tạo super admin..."
  node dist/scripts/create-superadmin.prod.js || echo "[entrypoint] Super admin đã tồn tại"

  node -e "require('fs').writeFileSync('$MIGRATION_FLAG', 'done')"
else
  echo "[entrypoint] Migration đã chạy trước đó."
fi

echo "[entrypoint] Khởi động API..."
exec node dist/src/server.js
