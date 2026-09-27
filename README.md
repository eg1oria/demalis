# Демалыс

Подборщик загородного отдыха на выходные вокруг Алматы. Полное техническое задание — [TZ.md](TZ.md), макеты — [design/](design/README.md).

Стек: Next.js (App Router) + TypeScript + Tailwind CSS + next-intl (`/ru`, `/kk`). Тесты — Vitest.

## Запуск локально

Нужны Node.js 24 (или 22+) и Docker Desktop (для локальной базы Supabase).

```bash
npm install
npm run db:start      # локальный Supabase в Docker (первый раз качает образы ~10 мин)
cp .env.example .env.local
```

`db:start` в конце печатает ключи. Впиши в `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — значение **Publishable**
- `SUPABASE_SECRET_KEY` — значение **Secret**
- `ADMIN_EMAILS` — свой email

Дальше:

```bash
npm run seed          # 12 тестовых объектов [ТЕСТ]
npm run dev
```

- Сайт: http://localhost:3000 (откроется `/ru`).
- Админка: http://localhost:3000/admin. Письма со ссылкой для входа локально не уходят на почту — они в Mailpit: http://127.0.0.1:54324.
- Панель базы (Supabase Studio): http://127.0.0.1:54323.

Облачный Supabase и Vercel — в [docs/SETUP.md](docs/SETUP.md).

## Команды

| Команда                | Что делает                             |
| ---------------------- | -------------------------------------- |
| `npm run dev`          | Сервер разработки                      |
| `npm run build`        | Продакшн-сборка                        |
| `npm start`            | Запуск собранного проекта              |
| `npm run lint`         | ESLint                                 |
| `npm run format`       | Отформатировать код Prettier           |
| `npm run format:check` | Проверить форматирование               |
| `npm test`             | Тесты Vitest (один прогон)             |
| `npm run test:watch`   | Тесты в режиме наблюдения              |
| `npm run db:start`     | Запустить локальный Supabase           |
| `npm run db:stop`      | Остановить локальный Supabase          |
| `npm run db:reset`     | Пересоздать локальную базу из миграций |
| `npm run db:types`     | Обновить TypeScript-типы базы          |
| `npm run seed`         | Залить 12 тестовых объектов            |

## Структура

```
messages/          переводы (ru.ts — основной, kk.ts — казахский)
src/app/[locale]/  страницы сайта
src/components/    компоненты
src/config/site.ts SITE_NAME и часовой пояс
src/i18n/          настройки next-intl
src/lib/           логика (getUpcomingWeekend и др.) и её тесты
src/app/admin/     админка (/admin, только русский)
src/lib/places/    справочники и проверка полей объекта (форма и CSV)
src/lib/supabase/  клиенты Supabase и типы базы
src/proxy.ts       редирект на язык (/ → /ru), сессия админки
supabase/          миграции SQL и настройки локального Supabase
scripts/seed.ts    тестовые данные
public/places_template.csv  шаблон для импорта объектов
docs/SETUP.md      как создать Supabase и Vercel и куда вставить ключи
```

## Переводы

Тексты лежат в `messages/ru.ts` и `messages/kk.ts`. Казахские строки, переведённые не носителем, помечены комментарием `// TODO: проверить носителю`.

## Прогресс

Что сделано и что дальше — в [PROGRESS.md](PROGRESS.md). Идеи вне ТЗ — в [IDEAS.md](IDEAS.md).
