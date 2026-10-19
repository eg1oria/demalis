#!/bin/sh
# Резервные копии Демалыс: дамп базы и фото, каждый день в 03:00 (часовой
# пояс — TZ из образа, Asia/Almaty). BACKUP_NOW=1 — одна копия сразу и выход.
# Как проверить, скачать и восстановить — README.md рядом.
set -eu

BACKUP_DIR=${BACKUP_DIR:-/backups}
UPLOADS_DIR=${UPLOADS_DIR:-/uploads}
KEEP_DUMPS=${KEEP_DUMPS:-14}

# Подключение к базе: пароль из POSTGRES_PASSWORD (тот же, что у сервиса
# postgres), иначе — DATABASE_URL без ?параметров (их pg_dump не понимает).
if [ -n "${POSTGRES_PASSWORD:-}" ]; then
  export PGHOST="${PGHOST:-postgres}" PGPORT="${PGPORT:-5432}" \
    PGUSER="${PGUSER:-demalis}" PGPASSWORD="${PGPASSWORD:-$POSTGRES_PASSWORD}"
  DB=${PGDATABASE:-demalis}
else
  DB=${DATABASE_URL:-}
  DB=${DB%%\?*}
fi

log() { echo "$(date '+%F %T') backup: $*"; }

# Одна копия. Запускается отдельным процессом (см. run), чтобы set -e
# срабатывал на любой ошибке.
backup_once() {
  [ -n "$DB" ] || { echo "не заданы POSTGRES_PASSWORD и DATABASE_URL" >&2; exit 1; }
  day=$(date +%F)
  mkdir -p "$BACKUP_DIR/db" "$BACKUP_DIR/uploads"

  # Сначала во временный файл: оборванный дамп не займёт место настоящего.
  tmp="$BACKUP_DIR/db/.demalis-$day.dump.tmp"
  pg_dump -Fc -d "$DB" -f "$tmp"
  mv -f "$tmp" "$BACKUP_DIR/db/demalis-$day.dump"

  # Храним последние KEEP_DUMPS дампов (имена с датой сортируются по времени).
  ls -1 "$BACKUP_DIR"/db/demalis-*.dump | sort -r | tail -n +"$((KEEP_DUMPS + 1))" |
    while read -r old; do rm -f "$old"; done

  # Фото не меняются (имена — uuid): только докладываем новые, ничего не удаляем.
  cp -an "$UPLOADS_DIR/." "$BACKUP_DIR/uploads/"

  log "готово: db/demalis-$day.dump ($(du -h "$BACKUP_DIR/db/demalis-$day.dump" | cut -f1)), фото: $(find "$BACKUP_DIR/uploads" -type f | wc -l)"
}

if [ "${1:-}" = --once ]; then
  backup_once
  exit 0
fi

notify() {
  log "ОШИБКА: $1"
  if [ -z "${TELEGRAM_BOT_TOKEN:-}" ] || [ -z "${ADMIN_TELEGRAM_CHAT_ID:-}" ]; then
    log "TELEGRAM_BOT_TOKEN или ADMIN_TELEGRAM_CHAT_ID не заданы — сообщение только в логе"
    return 0
  fi
  curl -fsS --max-time 20 -o /dev/null \
    "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
    --data-urlencode "chat_id=$ADMIN_TELEGRAM_CHAT_ID" \
    --data-urlencode "text=Демалыс: резервная копия не создана: $1" ||
    log "не удалось отправить сообщение в Telegram"
}

# Копия с сообщением админу при ошибке. Код возврата — как у копии.
run() {
  err=$(mktemp)
  rc=0
  "$0" --once 2>"$err" || rc=$?
  cat "$err" >&2
  if [ "$rc" -ne 0 ]; then
    rm -f "$BACKUP_DIR"/db/.*.tmp
    reason=$(tail -n 5 "$err" | cut -c1-500)
    notify "${reason:-неизвестная ошибка (код $rc)}"
  fi
  rm -f "$err"
  return "$rc"
}

# Секунд до ближайших 03:00 по местному времени.
seconds_until_3am() {
  now=$(date +%s)
  next=$(date -d 'today 03:00' +%s)
  [ "$next" -gt "$now" ] || next=$(date -d 'tomorrow 03:00' +%s)
  echo $((next - now))
}

if [ "${BACKUP_NOW:-}" = 1 ]; then
  rc=0
  run || rc=$?
  exit "$rc"
fi

log "запущено: копия каждый день в 03:00 (${TZ:-UTC}) в $BACKUP_DIR"
while :; do
  sleep "$(seconds_until_3am)"
  run || true
done
