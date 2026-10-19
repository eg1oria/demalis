-- Этап 4: лимит заявок и статистика объектов.

-- ── Лимит заявок: не больше N с одного IP за окно ──────────────────────
-- IP не храним: key — HMAC-хэш IP с секретом сервера, его нельзя
-- превратить обратно в адрес. Записи старше окна удаляются при каждом вызове.
create table public.lead_rate_limits (
  key text not null,
  created_at timestamptz not null default now()
);

create index lead_rate_limits_key_idx on public.lead_rate_limits (key, created_at);

-- Политик нет — доступ только у серверного кода.
alter table public.lead_rate_limits enable row level security;

-- true — заявку можно принять (попытка засчитана), false — лимит исчерпан.
create function public.hit_lead_rate_limit(
  p_key text,
  p_limit int,
  p_window interval
) returns boolean
language plpgsql
set search_path = ''
as $$
declare
  used int;
begin
  -- Две заявки одновременно с одного IP не должны обе пройти проверку.
  perform pg_advisory_xact_lock(hashtext('lead_rate_limit:' || p_key));

  delete from public.lead_rate_limits where created_at < now() - p_window;

  select count(*) into used from public.lead_rate_limits where key = p_key;
  if used >= p_limit then
    return false;
  end if;

  insert into public.lead_rate_limits (key) values (p_key);
  return true;
end;
$$;

revoke execute on function public.hit_lead_rate_limit(text, int, interval)
  from public, anon, authenticated;
grant execute on function public.hit_lead_rate_limit(text, int, interval)
  to service_role;

-- ── Статистика по объектам за 7 и 30 дней ──────────────────────────────
create index leads_created_at_idx on public.leads (created_at);
create index events_created_at_idx on public.events (created_at);

create function public.place_stats(p_now timestamptz default now())
returns table (
  place_id uuid,
  views_7 int,
  views_30 int,
  whatsapp_7 int,
  whatsapp_30 int,
  leads_7 int,
  leads_30 int
)
language sql
stable
set search_path = ''
as $$
  with ev as (
    select
      e.place_id,
      count(*) filter (where e.type = 'view' and e.created_at >= p_now - interval '7 days') as views_7,
      count(*) filter (where e.type = 'view') as views_30,
      count(*) filter (where e.type = 'whatsapp_click' and e.created_at >= p_now - interval '7 days') as whatsapp_7,
      count(*) filter (where e.type = 'whatsapp_click') as whatsapp_30
    from public.events e
    where e.created_at >= p_now - interval '30 days' and e.created_at <= p_now
    group by e.place_id
  ),
  ld as (
    select
      l.place_id,
      count(*) filter (where l.created_at >= p_now - interval '7 days') as leads_7,
      count(*) as leads_30
    from public.leads l
    where l.created_at >= p_now - interval '30 days' and l.created_at <= p_now
    group by l.place_id
  )
  select
    p.id,
    coalesce(ev.views_7, 0)::int,
    coalesce(ev.views_30, 0)::int,
    coalesce(ev.whatsapp_7, 0)::int,
    coalesce(ev.whatsapp_30, 0)::int,
    coalesce(ld.leads_7, 0)::int,
    coalesce(ld.leads_30, 0)::int
  from public.places p
  left join ev on ev.place_id = p.id
  left join ld on ld.place_id = p.id;
$$;

revoke execute on function public.place_stats(timestamptz)
  from public, anon, authenticated;
grant execute on function public.place_stats(timestamptz) to service_role;
