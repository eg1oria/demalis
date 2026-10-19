import type { PrismaClient } from '../generated/prisma/client';

export type PlaceStatsRow = {
  place_id: string;
  views_7: number;
  views_30: number;
  whatsapp_7: number;
  whatsapp_30: number;
  phone_7: number;
  phone_30: number;
  instagram_7: number;
  instagram_30: number;
  leads_7: number;
  leads_30: number;
};

/** Статистика объектов за 7 и 30 дней до now. */
export function placeStats(
  prisma: PrismaClient,
  now: Date = new Date(),
): Promise<PlaceStatsRow[]> {
  return prisma.$queryRaw<PlaceStatsRow[]>`
    with ev as (
      select
        e.place_id,
        count(*) filter (where e.type = 'view' and e.created_at >= ${now}::timestamptz - interval '7 days') as views_7,
        count(*) filter (where e.type = 'view') as views_30,
        count(*) filter (where e.type = 'whatsapp_click' and e.created_at >= ${now}::timestamptz - interval '7 days') as whatsapp_7,
        count(*) filter (where e.type = 'whatsapp_click') as whatsapp_30,
        count(*) filter (where e.type = 'phone_click' and e.created_at >= ${now}::timestamptz - interval '7 days') as phone_7,
        count(*) filter (where e.type = 'phone_click') as phone_30,
        count(*) filter (where e.type = 'instagram_click' and e.created_at >= ${now}::timestamptz - interval '7 days') as instagram_7,
        count(*) filter (where e.type = 'instagram_click') as instagram_30
      from events e
      where e.created_at >= ${now}::timestamptz - interval '30 days' and e.created_at <= ${now}::timestamptz
      group by e.place_id
    ),
    ld as (
      select
        l.place_id,
        count(*) filter (where l.created_at >= ${now}::timestamptz - interval '7 days') as leads_7,
        count(*) as leads_30
      from leads l
      where l.created_at >= ${now}::timestamptz - interval '30 days' and l.created_at <= ${now}::timestamptz
      group by l.place_id
    )
    select
      p.id::text as place_id,
      coalesce(ev.views_7, 0)::int as views_7,
      coalesce(ev.views_30, 0)::int as views_30,
      coalesce(ev.whatsapp_7, 0)::int as whatsapp_7,
      coalesce(ev.whatsapp_30, 0)::int as whatsapp_30,
      coalesce(ev.phone_7, 0)::int as phone_7,
      coalesce(ev.phone_30, 0)::int as phone_30,
      coalesce(ev.instagram_7, 0)::int as instagram_7,
      coalesce(ev.instagram_30, 0)::int as instagram_30,
      coalesce(ld.leads_7, 0)::int as leads_7,
      coalesce(ld.leads_30, 0)::int as leads_30
    from places p
    left join ev on ev.place_id = p.id
    left join ld on ld.place_id = p.id`;
}

export type PlaceStatsBetweenRow = {
  place_id: string;
  views: number;
  whatsapp: number;
  phone: number;
  instagram: number;
  leads: number;
};

/** Статистика объектов за произвольный период [from, to). */
export function placeStatsBetween(
  prisma: PrismaClient,
  from: Date,
  to: Date,
): Promise<PlaceStatsBetweenRow[]> {
  return prisma.$queryRaw<PlaceStatsBetweenRow[]>`
    with ev as (
      select
        e.place_id,
        count(*) filter (where e.type = 'view') as views,
        count(*) filter (where e.type = 'whatsapp_click') as whatsapp,
        count(*) filter (where e.type = 'phone_click') as phone,
        count(*) filter (where e.type = 'instagram_click') as instagram
      from events e
      where e.created_at >= ${from} and e.created_at < ${to}
      group by e.place_id
    ),
    ld as (
      select l.place_id, count(*) as leads
      from leads l
      where l.created_at >= ${from} and l.created_at < ${to}
      group by l.place_id
    )
    select
      p.id::text as place_id,
      coalesce(ev.views, 0)::int as views,
      coalesce(ev.whatsapp, 0)::int as whatsapp,
      coalesce(ev.phone, 0)::int as phone,
      coalesce(ev.instagram, 0)::int as instagram,
      coalesce(ld.leads, 0)::int as leads
    from places p
    left join ev on ev.place_id = p.id
    left join ld on ld.place_id = p.id`;
}
