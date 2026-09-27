-- Этап 5: Telegram-бот для владельцев.

-- Язык бота выбирается при первом /start. null — ещё не выбран.
alter table public.owners
  add column language text check (language in ('ru', 'kk'));

-- Код привязки: латиница и цифры (так его можно передать в ссылке t.me/бот?start=КОД).
alter table public.owners
  add constraint owners_link_code_format
  check (link_code is null or link_code ~ '^[A-Z0-9]{6,16}$');
