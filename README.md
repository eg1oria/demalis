# Демалыс

Подборщик загородного отдыха на выходные вокруг Алматы. Полное техническое задание — [TZ.md](TZ.md), макеты — [design/](design/README.md).

Стек: Next.js (App Router) + TypeScript + Tailwind CSS + next-intl (`/ru`, `/kk`). Тесты — Vitest.

## Запуск локально

Нужен Node.js 24 (или 22+).

```bash
npm install
cp .env.example .env.local
npm run dev
```

Открой http://localhost:3000 — откроется `/ru`. Переключатель «Рус / Қаз» в шапке.

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

## Структура

```
messages/          переводы (ru.ts — основной, kk.ts — казахский)
src/app/[locale]/  страницы сайта
src/components/    компоненты
src/config/site.ts SITE_NAME и часовой пояс
src/i18n/          настройки next-intl
src/lib/           логика (getUpcomingWeekend и др.) и её тесты
src/proxy.ts       редирект на язык (/ → /ru)
docs/SETUP.md      как создать Supabase и Vercel и куда вставить ключи
```

## Переводы

Тексты лежат в `messages/ru.ts` и `messages/kk.ts`. Казахские строки, переведённые не носителем, помечены комментарием `// TODO: проверить носителю`.

## Прогресс

Что сделано и что дальше — в [PROGRESS.md](PROGRESS.md). Идеи вне ТЗ — в [IDEAS.md](IDEAS.md).
