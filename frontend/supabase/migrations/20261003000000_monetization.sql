-- Этап 8: ручная монетизация (без платёжных интеграций).

-- Pro действует по эту дату включительно; null — без срока.
-- После даты ежедневный cron возвращает объект на free.
alter table public.places
  add column pro_until date,
  -- Для какой даты окончания Pro владельцу уже ушло напоминание «за 5 дней».
  add column pro_reminded_for date;

-- Оплаты, принятые вручную (счёт в Kaspi от ИП).
create type public.payment_kind as enum ('pro', 'promotion', 'video', 'leads', 'other');

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places (id) on delete cascade,
  amount int not null check (amount > 0),
  kind public.payment_kind not null,
  paid_at date not null default current_date,
  comment text,
  created_at timestamptz not null default now()
);

create index payments_place_id_paid_at_idx on public.payments (place_id, paid_at);
create index payments_paid_at_idx on public.payments (paid_at);

-- Политик нет — только серверный код с секретным ключом (админка).
alter table public.payments enable row level security;

-- Платные заявки за месяц — отчёт в админке.
create index leads_billable_created_at_idx on public.leads (created_at) where billable;
