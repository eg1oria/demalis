# Демалыс

Подборщик загородного отдыха на выходные вокруг Алматы.

| Папка                  | Что там                                                           |
| ---------------------- | ----------------------------------------------------------------- |
| [frontend/](frontend/) | Сайт и админка: Next.js, next-intl, Tailwind                      |
| [backend/](backend/)   | API: NestJS + PostgreSQL (Prisma), вход, фото, Telegram-бот, cron |
| `docker-compose.yml`   | Локальные Postgres и Mailpit (почта для входа в админку)          |

## Запуск локально

```bash
docker compose up -d                      # база и почтовый ящик

cd backend
npm install
cp .env.example .env                      # секреты и ADMIN_EMAILS
npm run db:migrate
npm run start:dev                         # API на http://localhost:4000

cd ../frontend                            # во втором терминале
npm install
cp .env.example .env.local                # API_URL, INTERNAL_API_SECRET, ADMIN_EMAILS
npm run dev                               # сайт на http://localhost:3000
```

Подробнее — [backend/README.md](backend/README.md) и [frontend/README.md](frontend/README.md).
