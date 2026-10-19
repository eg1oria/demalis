# Демалыс

Подборщик загородного отдыха на выходные вокруг Алматы. Полное техническое задание — [TZ.md](TZ.md), макеты — [design/](design/README.md).

Стек: Next.js (App Router) + TypeScript + Tailwind CSS + next-intl (`/ru`, `/kk`). Тесты — Vitest. Данные — API бэкенда (`../backend`, NestJS + PostgreSQL).

## Запуск локально

Нужны Node.js 24 (или 22+) и Docker Desktop. Данные, вход в админку, фото и Telegram-бот живут в бэкенде (`../backend`, NestJS + PostgreSQL) — сначала запусти его по [backend/README.md](../backend/README.md).

```bash
npm install
cp .env.example .env.local
```

В `.env.local` впиши:

- `API_URL=http://127.0.0.1:4000` и `NEXT_PUBLIC_API_URL=http://localhost:4000` — адрес бэкенда;
- `INTERNAL_API_SECRET` — то же значение, что в `backend/.env`;
- `ADMIN_EMAILS` — свой email (тот же, что в `backend/.env`).

```bash
npm run dev
```

- Сайт: http://localhost:3000 (откроется `/ru`).
- Админка: http://localhost:3000/admin (объекты, заявки, статистика, импорт). Локально письма со ссылкой входа попадают в Mailpit: http://127.0.0.1:8025. Можно и без письма: впиши email из `ADMIN_EMAILS` и нажми **«Войти без письма»** (кнопка есть только при `npm run dev` с локальным бэкендом).
- Фото объектов отдаёт бэкенд, сайт проксирует их по адресу `/uploads/…` (`next.config.ts`).

## После обновления кода (`git pull`)

```bash
npm install                       # здесь и в ../backend
cd ../backend && npm run db:migrate   # новые таблицы, данные не стираются
npm run dev
```

`npm run dev` перед запуском сам проверяет библиотеки, настройки в `.env.local` и что бэкенд отвечает, и пишет, что сделать, если что-то не так.

Сервер для бэкенда и Vercel для сайта — в [docs/SETUP.md](docs/SETUP.md). Метрика, Search Console, Яндекс Вебмастер, Google Ads — в [docs/SEO.md](docs/SEO.md).

## Команды

| Команда                | Что делает                   |
| ---------------------- | ---------------------------- |
| `npm run dev`          | Сервер разработки            |
| `npm run build`        | Продакшн-сборка              |
| `npm start`            | Запуск собранного проекта    |
| `npm run lint`         | ESLint                       |
| `npm run format`       | Отформатировать код Prettier |
| `npm run format:check` | Проверить форматирование     |
| `npm test`             | Тесты Vitest (один прогон)   |
| `npm run test:watch`   | Тесты в режиме наблюдения    |

База, тестовые данные и Telegram-бот — команды бэкенда (`../backend/README.md`).

## Структура

```
messages/          переводы (ru.ts — основной, kk.ts — казахский)
src/app/[locale]/  страницы сайта
src/components/    компоненты
src/config/site.ts SITE_NAME и часовой пояс
src/config/pricing.ts  тарифы для владельцев (цены)
src/config/legal.ts    реквизиты и контакты: подвал, «О нас», «Контакты», юр. страницы (заполнить!)
src/content/           тексты политики, соглашения, оферты, «О нас», «Проверено» (шаблоны)
src/lib/consent.ts     cookie-согласие (баннер, Consent Mode v2)
src/lib/analytics.ts   события GA4 и конверсии Google Ads
src/i18n/          настройки next-intl
src/lib/           логика (getUpcomingWeekend и др.) и её тесты
src/app/admin/     админка (/admin, только русский)
src/lib/places/    справочники и проверка полей объекта (форма и CSV)
src/lib/api/       клиент API бэкенда, типы строк базы, адреса фото
src/lib/leads/     проверка заявки, статусы, текст для Telegram
src/lib/seo.ts     метаданные, hreflang, JSON-LD
src/lib/collections.ts  подборки (фильтры, перевод)
src/app/sitemap.ts, robots.ts  sitemap.xml и robots.txt
src/lib/go.ts      ссылки /api/go/... (учёт кликов WhatsApp, звонка, Instagram)
src/app/api/       маршруты: счётчик вариантов, клики, просмотры, картинка для соцсетей
src/lib/plans.ts   тарифы: Pro на дату, продвижение, напоминание о конце Pro
src/proxy.ts       редирект на язык (/ → /ru)
public/places_template.csv  шаблон для импорта объектов
docs/SETUP.md      сервер для бэкенда, Vercel, Telegram и куда вставить ключи
```

## Переводы

Тексты лежат в `messages/ru.ts` и `messages/kk.ts`. Казахские строки, переведённые не носителем, помечены комментарием `// TODO: проверить носителю`.

## Прогресс

Что сделано и что дальше — в [PROGRESS.md](PROGRESS.md). Идеи вне ТЗ — в [IDEAS.md](IDEAS.md).
