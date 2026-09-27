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
- Админка: http://localhost:3000/admin (объекты, заявки, статистика, импорт). Письма со ссылкой для входа локально не уходят на почту — они в Mailpit: http://127.0.0.1:54324.
- Панель базы (Supabase Studio): http://127.0.0.1:54323.

## После обновления кода (`git pull`)

Новые этапы добавляют библиотеки и таблицы в базе. После каждого `git pull`:

```bash
npm install           # новые библиотеки (иначе ошибки вида «Can't resolve 'grammy'»)
npm run db:migrate    # новые таблицы в локальной базе, данные не стираются
npm run dev
```

`npm run dev` перед запуском сам проверяет библиотеки, ключи в `.env.local` и локальную базу (новые миграции применяет автоматически) и пишет, что сделать, если что-то не так. Для облачной базы Supabase новые миграции применяются командой `npx supabase db push` (docs/SETUP.md).

Если база «сломалась» и не жалко данных: `npm run db:reset`, затем `npm run seed`.

Облачный Supabase и Vercel — в [docs/SETUP.md](docs/SETUP.md). Метрика, Search Console, Яндекс Вебмастер — в [docs/SEO.md](docs/SEO.md).

## Команды

| Команда                | Что делает                                                    |
| ---------------------- | ------------------------------------------------------------- |
| `npm run dev`          | Сервер разработки                                             |
| `npm run build`        | Продакшн-сборка                                               |
| `npm start`            | Запуск собранного проекта                                     |
| `npm run lint`         | ESLint                                                        |
| `npm run format`       | Отформатировать код Prettier                                  |
| `npm run format:check` | Проверить форматирование                                      |
| `npm test`             | Тесты Vitest (один прогон)                                    |
| `npm run test:watch`   | Тесты в режиме наблюдения                                     |
| `npm run db:start`     | Запустить локальный Supabase                                  |
| `npm run db:stop`      | Остановить локальный Supabase                                 |
| `npm run db:reset`     | Пересоздать локальную базу из миграций                        |
| `npm run db:migrate`   | Применить новые миграции к локальной базе (без потери данных) |
| `npm run db:types`     | Обновить TypeScript-типы базы                                 |
| `npm run seed`         | Залить 12 тестовых объектов                                   |
| `npm run bot:webhook`  | Подключить Telegram-бота к сайту                              |

## Структура

```
messages/          переводы (ru.ts — основной, kk.ts — казахский)
src/app/[locale]/  страницы сайта
src/components/    компоненты
src/config/site.ts SITE_NAME и часовой пояс
src/config/pricing.ts  тарифы для владельцев (цены)
src/config/legal.ts    реквизиты для политики конфиденциальности (заполнить!)
src/content/privacy.ts текст политики конфиденциальности (шаблон)
src/i18n/          настройки next-intl
src/lib/           логика (getUpcomingWeekend и др.) и её тесты
src/app/admin/     админка (/admin, только русский)
src/lib/places/    справочники и проверка полей объекта (форма и CSV)
src/lib/supabase/  клиенты Supabase и типы базы
src/lib/leads/     проверка заявки, статусы, текст для Telegram
src/lib/bot/       Telegram-бот владельцев (grammY): меню, кнопки, тексты ru/kk
src/lib/seo.ts     метаданные, hreflang, JSON-LD
src/lib/collections.ts  подборки (фильтры, перевод)
src/app/sitemap.ts, robots.ts  sitemap.xml и robots.txt
src/lib/go.ts      ссылки /api/go/... (учёт кликов WhatsApp, звонка, Instagram)
src/app/api/       маршруты: счётчик вариантов, клики, просмотры, webhook бота, ежедневный cron
src/lib/plans.ts   тарифы: Pro на дату, продвижение, напоминание о конце Pro
vercel.json        расписание напоминаний (Vercel Cron)
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
