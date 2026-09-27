# Инструкция для владельца проекта: Supabase и Vercel

Оба сервиса бесплатны на старте, банковская карта не нужна. Ключи никому не пересылай и не вставляй в код — только в `.env.local` (на своём компьютере) и в настройки Vercel.

Интерфейсы сервисов иногда меняются. Если пункт меню называется немного иначе, ищи по смыслу.

---

## 1. Supabase (база данных, вход в админку, хранение фото)

Понадобится с Этапа 1. Можно сделать заранее.

1. Зайди на https://supabase.com → **Start your project** → войди через GitHub.
2. **New project**:
   - **Name:** `demalis`;
   - **Database Password:** нажми **Generate**, сохрани пароль в менеджере паролей (в `.env` он не нужен);
   - **Region:** ближайший к Казахстану — **Central EU (Frankfurt)**;
   - тариф — **Free**.
3. Подожди 1–2 минуты, пока проект создаётся.
4. Скопируй ключи:
   - **Project Settings → Data API** (или кнопка **Connect** вверху) → **Project URL** → это `NEXT_PUBLIC_SUPABASE_URL`;
   - **Project Settings → API Keys**:
     - **Publishable key** (начинается с `sb_publishable_`) → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`;
     - **Secret key** (начинается с `sb_secret_`) → `SUPABASE_SECRET_KEY`.
   - Если видишь только старые ключи **anon** и **service_role** — подойдут и они: `anon` вместо publishable, `service_role` вместо secret.
5. Реши, с каких email можно входить в админку. Впиши их через запятую в `ADMIN_EMAILS`, например `me@gmail.com,partner@gmail.com`.

> ⚠️ **Secret key даёт полный доступ к базе.** Никогда не добавляй к нему префикс `NEXT_PUBLIC_` и не отправляй в чаты.
>
> ℹ️ На бесплатном тарифе Supabase ставит проект на паузу, если им не пользоваться около недели. Включается обратно кнопкой **Restore** в панели.

### Настройка входа по ссылке

**Authentication → URL Configuration**:

- **Site URL** — адрес сайта на Vercel (появится после шага 2);
- **Redirect URLs** — `http://localhost:3000/**` и `https://<твой-адрес>.vercel.app/**`.

> ℹ️ Встроенная почта Supabase на бесплатном тарифе отправляет всего несколько писем в час. Для 1–2 админов этого хватает. Если ссылка не приходит — подожди час или подключи свой SMTP (Authentication → Emails → SMTP Settings).

### Создать таблицы в облачной базе

Таблицы описаны в миграциях `supabase/migrations/*.sql`. Один раз свяжи проект и отправь миграции:

```bash
npx supabase login
npx supabase link --project-ref <ref>
npx supabase db push
```

`<ref>` — часть адреса проекта: `https://<ref>.supabase.co`. При `link` спросят пароль базы из шага 2.

После каждого нового этапа с изменениями базы повторяй `npx supabase db push`.

Тестовые объекты в облако можно залить так: пропиши облачные ключи в `.env.local` и запусти `npm run seed`. Удаляются они повторным запуском или вручную (у всех в названии `[ТЕСТ]`).

---

## 2. Vercel (хостинг сайта)

1. Зайди на https://vercel.com → **Sign Up** → **Continue with GitHub**. Тариф — **Hobby** (бесплатный).
2. **Add New… → Project** → найди репозиторий `demalis` → **Import**. Если репозитория нет в списке, нажми **Adjust GitHub App Permissions** и дай доступ к нему.
3. **Framework Preset** определится сам (Next.js). Root Directory оставь пустым: проект лежит в корне репозитория.
4. Открой **Environment Variables** и добавь переменные из `.env.example`. Нужны `NEXT_PUBLIC_SITE_NAME`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` и `ADMIN_EMAILS` — без ключей Supabase сборка не пройдёт.
5. **Deploy**. Через 1–2 минуты появится адрес вида `https://demalis-xxx.vercel.app`. Он должен открывать `/ru`.
6. **Settings → Functions → Function Region** → по возможности выбери **Frankfurt (fra1)**, рядом с базой Supabase.

Дальше каждый `git push` в ветку `main` сам обновляет сайт.

> ⚠️ **Бесплатный тариф Vercel — только для некоммерческих проектов.** Для разработки и проверки идеи этого хватает. Перед Этапом 8 (монетизация) проверь актуальные условия и при необходимости перейди на платный тариф или другой хостинг.

---

## 2а. Telegram: уведомления о заявках (Этап 4)

О каждой новой заявке сайт пишет в Telegram админу. Нужны бот и номер твоего чата.

1. В Telegram открой [@BotFather](https://t.me/BotFather) → `/newbot` → придумай имя и логин бота (должен кончаться на `bot`).
2. BotFather пришлёт токен вида `123456789:AA...` — это `TELEGRAM_BOT_TOKEN`. Никому его не показывай.
3. Найди своего бота по логину и нажми **Start** (бот не может писать тому, кто ему ни разу не писал).
4. Открой в браузере `https://api.telegram.org/bot<ТОКЕН>/getUpdates` (вместо `<ТОКЕН>` — токен из п. 2). В ответе найди `"chat":{"id":123456789` — это число и есть `ADMIN_TELEGRAM_CHAT_ID`.
   - Хочешь получать заявки в группу: добавь бота в группу, напиши там любое сообщение и снова открой ссылку — id группы начинается с минуса (`-100...`).
5. Впиши оба значения в `.env.local` и в Vercel → Settings → Environment Variables, затем сделай Redeploy.
6. Заполни и `NEXT_PUBLIC_SITE_URL` (адрес сайта) — тогда в сообщении будет ссылка на список заявок.

Если переменные не заданы, заявки всё равно сохраняются и видны в админке (`/admin/leads`), просто без сообщения в Telegram.

---

## 2б. Telegram-бот для владельцев (Этап 5)

Бот тот же, что в разделе 2а. Владельцы отмечают в нём свободные даты, получают заявки и напоминания.

**1. Секреты.** Придумай две длинные случайные строки (буквы и цифры, 30+ символов) и впиши в `.env.local` и в Vercel → Settings → Environment Variables:

- `TELEGRAM_WEBHOOK_SECRET` — Telegram будет присылать её с каждым сообщением, чужие запросы сайт отклонит;
- `CRON_SECRET` — Vercel будет присылать её в еженедельный запуск напоминаний.

После этого — Redeploy.

**2. Подключить бота к сайту** (один раз, после деплоя и каждый раз при смене адреса сайта). Проще всего — открыть в браузере ссылку, подставив свои значения:

```
https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=<NEXT_PUBLIC_SITE_URL>/api/telegram/webhook&secret_token=<TELEGRAM_WEBHOOK_SECRET>
```

Ответ `"ok":true` — готово. Или из терминала: `npm run bot:webhook` (берёт значения из `.env.local`, адрес сайта должен быть `https://`).

**3. Привязать владельца.** Админка → «Владельцы» → «Добавить владельца» → «Создать код привязки». Отправь владельцу ссылку `t.me/…?start=КОД` (или код: он пишет боту `/start КОД`). Владелец выбирает язык — и бот показывает меню. Код одноразовый. Объекты владельцу назначаются в карточке объекта (поле «Владелец»).

**4. Напоминание** «Обновите занятость на выходные» уходит по четвергам в 12:00 по Алматы (`vercel.json`, 07:00 UTC). На бесплатном тарифе Vercel запуск бывает в течение часа — то есть между 12:00 и 12:59. Проверить вручную: Vercel → проект → Settings → Cron Jobs → Run.

---

## 3. Локальный запуск на своём компьютере

```bash
cp .env.example .env.local
```

Открой `.env.local` и вставь значения из шагов выше, затем:

```bash
npm install
npm run dev
```

Сайт откроется на http://localhost:3000.

---

## Куда какой ключ

| Переменная                             | Где взять                                            | Этап |
| -------------------------------------- | ---------------------------------------------------- | ---- |
| `NEXT_PUBLIC_SITE_NAME`                | Название сайта, по умолчанию «Демалыс»               | 0    |
| `NEXT_PUBLIC_SUPABASE_URL`             | Supabase → Project Settings → Data API → Project URL | 1    |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → Project Settings → API Keys → Publishable | 1    |
| `SUPABASE_SECRET_KEY`                  | Supabase → Project Settings → API Keys → Secret      | 1    |
| `ADMIN_EMAILS`                         | Твои email через запятую                             | 1    |
| `TELEGRAM_BOT_TOKEN`                   | @BotFather в Telegram, см. раздел 2а                 | 4–5  |
| `TELEGRAM_WEBHOOK_SECRET`              | Любая длинная случайная строка, см. раздел 2б        | 5    |
| `CRON_SECRET`                          | Любая длинная случайная строка, см. раздел 2б        | 5    |
| `ADMIN_TELEGRAM_CHAT_ID`               | См. раздел 2а                                        | 4    |
| `NEXT_PUBLIC_SITE_URL`                 | Адрес сайта на Vercel или свой домен                 | 4, 6 |
| `NEXT_PUBLIC_YANDEX_METRIKA_ID`        | Яндекс Метрика (инструкция будет на Этапе 6)         | 6    |
