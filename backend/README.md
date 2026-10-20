# Демалыс — бэкенд

NestJS + PostgreSQL (Prisma). Владеет базой, входом в админку, фото объектов, Telegram-ботом и ежедневными задачами. Фронтенд (`../frontend`) ходит сюда по HTTP.

## Запуск локально

Нужны Node.js 24 и Docker Desktop.

```bash
docker compose up -d          # в корне репозитория: Postgres (5440) и Mailpit (8025)
cd backend
npm install                   # заодно генерирует клиент Prisma
cp .env.example .env          # впиши секреты и ADMIN_EMAILS
npm run db:migrate            # таблицы в базе
npm run seed                  # 12 тестовых объектов [ТЕСТ] (по желанию)
npm run start:dev             # http://localhost:4000
```

Проверка: http://localhost:4000/health → `{"ok":true}`.

## Команды

| Команда               | Что делает                                                   |
| --------------------- | ------------------------------------------------------------ |
| `npm run start:dev`   | Сервер разработки с перезапуском при изменениях              |
| `npm run build`       | Сборка в `dist/`                                             |
| `npm run start:prod`  | Запуск собранного (`node dist/main`)                         |
| `npm test`            | Юнит-тесты (Jest)                                            |
| `npm run test:e2e`    | Проверка API на запущенной базе                              |
| `npm run lint`        | oxlint                                                       |
| `npm run db:migrate`  | Новые миграции в локальную базу (данные не стираются)        |
| `npm run db:deploy`   | Миграции на сервере (без создания новых)                     |
| `npm run db:reset`    | Пересоздать базу из миграций (данные стираются)              |
| `npm run db:studio`   | Просмотр базы в браузере (Prisma Studio)                     |
| `npm run seed`        | Тестовые объекты `[ТЕСТ]`                                    |
| `npm run demo`        | Демо поверх `[ТЕСТ]`: видео, отзывы (ничего не удаляет)      |
| `npm run bot:webhook` | Подключить Telegram-бота к `PUBLIC_API_URL/telegram/webhook` |

## Устройство

```
prisma/schema.prisma       таблицы и enum; миграции — prisma/migrations
src/public/                API публичных страниц: каталог, объект, подборки, клики, заявки
src/admin/                 API админки (только с токеном админа)
src/auth/                  вход по ссылке на email (JWT), AdminGuard
src/photos/                загрузка фото по подписанной ссылке, раздача /uploads
src/bot/, src/telegram/    Telegram-бот владельцев (grammY), уведомления
src/cron/                  webhook бота и ежедневные задачи (12:00 по Алматы)
src/units/                 домики: занятость по домикам → статус объекта (availability)
src/common/                статистика (SQL), лимит заявок, сериализация ответа
src/shared/                чистые модули — копии из frontend/src/lib (менять вместе)
scripts/                   seed, webhook бота
```

Ответы API — в snake_case, как колонки базы: даты без времени — `"YYYY-MM-DD"`, моменты — ISO-строки.

### Модули в `src/shared/`

Проверки форм, даты, тарифы и тексты нужны и бэкенду (источник правды), и фронтенду (подсказки в формах, предпросмотр CSV). Это копии файлов `frontend/src/lib/…` — путь оригинала указан в первой строке. Меняешь один — поменяй и второй.

## Сервер

Бэкенду нужен постоянно работающий процесс и диск для `uploads/` — VPS с Docker, там же работает и сайт (`docker-compose.prod.yml`, `deploy/deploy.sh`). Пошаговая инструкция для владельца — `frontend/docs/SETUP.md`, раздел 1.

```
Dockerfile                    образ: npm ci → prisma generate → nest build; запуск node dist/main
../docker-compose.prod.yml    postgres:17 + бэкенд + Caddy (https), настройки — из backend/.env
../deploy/Caddyfile           Caddy проксирует PUBLIC_API_URL → backend:4000, сам выпускает сертификат
```

```bash
# на сервере, в корне репозитория
docker compose -f docker-compose.prod.yml up -d --build    # первый запуск и каждое обновление
docker compose -f docker-compose.prod.yml logs -f backend  # логи
curl http://127.0.0.1:4000/health                          # {"ok":true}
```

- Миграции (`prisma migrate deploy`) образ применяет сам при каждом старте.
- Тома: `postgres-data` — база, `uploads` — фото, `caddy-data` — сертификаты. Порт базы наружу не открыт; бэкенд опубликован только на `127.0.0.1:4000`, снаружи — через Caddy (80/443).
- В образе `NODE_ENV=production`: «Войти без письма» отключён.
- В образе нет `tsx` и dev-зависимостей, поэтому `npm run seed` там не работает. Webhook бота: `docker compose -f docker-compose.prod.yml exec backend node --no-warnings scripts/set-webhook.ts`.
- Если запущено несколько экземпляров, ежедневные задачи оставь только на одном (`CRON_ENABLED=false` на остальных).
