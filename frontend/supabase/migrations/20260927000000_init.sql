-- Этап 1: базовая схема (раздел 5 ТЗ).
-- Публично читаются только опубликованные объекты и их занятость.
-- Всё остальное пишет и читает только серверный код с секретным ключом
-- (он обходит RLS) после проверки, что пользователь — админ.

-- ── Типы ────────────────────────────────────────────────────────────────
create type public.place_type as enum (
  'glamping', 'aframe', 'house', 'zona_otdyha', 'banya_complex', 'guesthouse'
);

create type public.place_direction as enum (
  'gory_almaty', 'talgar', 'issyk_turgen', 'kaskelen', 'kapshagay',
  'charyn_kolsai', 'drugoe'
);

create type public.price_unit as enum ('per_night_unit', 'per_person');
create type public.place_status as enum ('draft', 'published', 'hidden');
create type public.place_plan as enum ('free', 'pro');
create type public.availability_status as enum ('free', 'limited', 'full');
create type public.lead_status as enum (
  'new', 'sent_to_owner', 'confirmed', 'cancelled', 'no_answer'
);
create type public.event_type as enum (
  'view', 'whatsapp_click', 'phone_click', 'instagram_click'
);

-- ── updated_at ──────────────────────────────────────────────────────────
create function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── owners ──────────────────────────────────────────────────────────────
create table public.owners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  telegram_chat_id bigint unique,
  link_code text unique,
  created_at timestamptz not null default now()
);

-- ── places ──────────────────────────────────────────────────────────────
create table public.places (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name_ru text not null check (length(trim(name_ru)) > 0),
  name_kk text,
  type public.place_type not null,
  direction public.place_direction not null,
  address_text text,
  lat numeric(9, 6) check (lat between -90 and 90),
  lng numeric(9, 6) check (lng between -180 and 180),
  drive_minutes int check (drive_minutes >= 0),
  price_from int check (price_from >= 0),
  price_unit public.price_unit not null default 'per_night_unit',
  capacity_max int check (capacity_max > 0),
  has_banya boolean not null default false,
  has_chan boolean not null default false,
  has_pool boolean not null default false,
  pets_allowed boolean not null default false,
  has_kitchen boolean not null default false,
  has_bbq boolean not null default false,
  winter_ok boolean not null default false,
  has_wifi boolean not null default false,
  description_ru text,
  description_kk text,
  whatsapp_phone text not null check (whatsapp_phone ~ '^\+77[0-9]{9}$'),
  instagram_url text,
  photos text[] not null default '{}',
  video_url text,
  status public.place_status not null default 'draft',
  plan public.place_plan not null default 'free',
  featured_until date,
  owner_id uuid references public.owners (id) on delete set null,
  photos_permission boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index places_status_idx on public.places (status);
create index places_owner_id_idx on public.places (owner_id);

create trigger places_set_updated_at
  before update on public.places
  for each row execute function public.set_updated_at();

-- ── availability ────────────────────────────────────────────────────────
-- Нет записи на дату — статус «неизвестно».
create table public.availability (
  place_id uuid not null references public.places (id) on delete cascade,
  date date not null,
  status public.availability_status not null,
  updated_at timestamptz not null default now(),
  primary key (place_id, date)
);

create index availability_date_idx on public.availability (date);

create trigger availability_set_updated_at
  before update on public.availability
  for each row execute function public.set_updated_at();

-- ── leads ───────────────────────────────────────────────────────────────
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places (id) on delete cascade,
  name text not null,
  phone text not null check (phone ~ '^\+77[0-9]{9}$'),
  date_from date,
  date_to date,
  guests int check (guests > 0),
  comment text,
  status public.lead_status not null default 'new',
  billable boolean not null default false,
  created_at timestamptz not null default now(),
  check (date_to is null or date_from is null or date_to >= date_from)
);

create index leads_place_id_created_at_idx on public.leads (place_id, created_at);

-- ── events ──────────────────────────────────────────────────────────────
-- Без IP и персональных данных.
create table public.events (
  id bigint generated always as identity primary key,
  place_id uuid not null references public.places (id) on delete cascade,
  type public.event_type not null,
  created_at timestamptz not null default now()
);

create index events_place_id_created_at_idx on public.events (place_id, created_at);

-- ── RLS ─────────────────────────────────────────────────────────────────
alter table public.owners enable row level security;
alter table public.places enable row level security;
alter table public.availability enable row level security;
alter table public.leads enable row level security;
alter table public.events enable row level security;

create policy "Опубликованные объекты видны всем"
  on public.places for select
  to anon, authenticated
  using (status = 'published');

create policy "Занятость опубликованных объектов видна всем"
  on public.availability for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.places p
      where p.id = availability.place_id and p.status = 'published'
    )
  );

-- owners, leads, events: политик нет — доступ только у серверного кода.

-- ── Storage: фото объектов ─────────────────────────────────────────────
-- Публичное чтение по прямой ссылке; загрузка — только через подписанные
-- ссылки, которые выдаёт сервер после проверки админа.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'place-photos',
  'place-photos',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
);
