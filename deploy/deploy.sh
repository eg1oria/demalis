#!/bin/sh
# Первый запуск и каждое обновление на сервере (из папки с репозиторием):
#   ./deploy/deploy.sh
# Без скачивания нового кода (например, после правки .env): ./deploy/deploy.sh --no-pull
set -eu
cd "$(dirname "$0")/.."

for f in backend/.env frontend/.env; do
  if [ ! -f "$f" ]; then
    echo "Нет $f — заполни его по frontend/docs/SETUP.md" >&2
    exit 1
  fi
done

if [ "${1:-}" != "--no-pull" ]; then
  git pull --ff-only
fi

compose="docker compose -f docker-compose.prod.yml"

# Сначала база, бэкенд и копии: сайт при сборке берёт у бэкенда данные.
$compose up -d --build --wait postgres backend backup
$compose build frontend
# Без --build: бэкенд уже собран и не перезапускается второй раз.
$compose up -d --wait --remove-orphans
# Старые образы после пересборки занимают место на диске.
docker image prune -f >/dev/null

echo "Готово. Проверка: $compose ps"
