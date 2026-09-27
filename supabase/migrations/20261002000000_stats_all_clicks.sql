-- Статистика: кроме просмотров, WhatsApp и заявок — клики «Позвонить» и Instagram.
-- Меняется набор колонок, поэтому функцию пересоздаём.
drop function public.place_stats(timestamptz);

create function public.place_stats(p_now timestamptz default now())
returns table (
  place_id uuid,
  views_7 int,
  views_30 int,
  whatsapp_7 int,
  whatsapp_30 int,
  phone_7 int,
  phone_30 int,
  instagram_7 int,
  instagram_30 int,
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
      count(*) filter (where e.type = 'whatsapp_click') as whatsapp_30,
      count(*) filter (where e.type = 'phone_click' and e.created_at >= p_now - interval '7 days') as phone_7,
      count(*) filter (where e.type = 'phone_click') as phone_30,
      count(*) filter (where e.type = 'instagram_click' and e.created_at >= p_now - interval '7 days') as instagram_7,
      count(*) filter (where e.type = 'instagram_click') as instagram_30
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
    coalesce(ev.phone_7, 0)::int,
    coalesce(ev.phone_30, 0)::int,
    coalesce(ev.instagram_7, 0)::int,
    coalesce(ev.instagram_30, 0)::int,
    coalesce(ld.leads_7, 0)::int,
    coalesce(ld.leads_30, 0)::int
  from public.places p
  left join ev on ev.place_id = p.id
  left join ld on ld.place_id = p.id;
$$;

revoke execute on function public.place_stats(timestamptz)
  from public, anon, authenticated;
grant execute on function public.place_stats(timestamptz) to service_role;
