-- Этап 9: ежемесячный отчёт владельцу.

-- За какой месяц (YYYY-MM) владельцу уже ушёл автоматический отчёт — без повторов.
alter table public.owners
  add column last_report_month text check (last_report_month ~ '^\d{4}-\d{2}$');

-- Статистика объектов за произвольный период [p_from, p_to):
-- календарный месяц в отчёте и в админке.
create function public.place_stats_between(p_from timestamptz, p_to timestamptz)
returns table (
  place_id uuid,
  views int,
  whatsapp int,
  phone int,
  instagram int,
  leads int
)
language sql
stable
set search_path = ''
as $$
  with ev as (
    select
      e.place_id,
      count(*) filter (where e.type = 'view') as views,
      count(*) filter (where e.type = 'whatsapp_click') as whatsapp,
      count(*) filter (where e.type = 'phone_click') as phone,
      count(*) filter (where e.type = 'instagram_click') as instagram
    from public.events e
    where e.created_at >= p_from and e.created_at < p_to
    group by e.place_id
  ),
  ld as (
    select l.place_id, count(*) as leads
    from public.leads l
    where l.created_at >= p_from and l.created_at < p_to
    group by l.place_id
  )
  select
    p.id,
    coalesce(ev.views, 0)::int,
    coalesce(ev.whatsapp, 0)::int,
    coalesce(ev.phone, 0)::int,
    coalesce(ev.instagram, 0)::int,
    coalesce(ld.leads, 0)::int
  from public.places p
  left join ev on ev.place_id = p.id
  left join ld on ld.place_id = p.id;
$$;

revoke execute on function public.place_stats_between(timestamptz, timestamptz)
  from public, anon, authenticated;
grant execute on function public.place_stats_between(timestamptz, timestamptz)
  to service_role;
