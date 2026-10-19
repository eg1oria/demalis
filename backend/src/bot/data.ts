import { almatyToday, type IsoDate, toIsoDate } from '../shared/dates';
import type { LeadStatus } from '../shared/leads/constants';
import type { AvailabilityStatus } from '../shared/places/constants';
import { planFeatures } from '../shared/plans';
import { placeStats } from '../common/stats';
import { saveDays } from '../units/units';
import { db } from '../prisma/prisma';
import { isoDateOrNull } from '../prisma/dates';
import { type BotLang, isBotLang } from './texts';

/**
 * Владелец, привязанный к чату бота. language: null — ещё не выбран.
 * awaiting: что бот ждёт текстом (цену за праздничную ночь), null — ничего.
 */
export type BotOwner = {
  id: string;
  name: string;
  language: BotLang | null;
  awaiting: string | null;
};

export type BotPlace = { id: string; name_ru: string; name_kk: string | null };

const OWNER_SELECT = {
  id: true,
  name: true,
  language: true,
  awaiting_input: true,
} as const;
const PLACE_SELECT = { id: true, name_ru: true, name_kk: true } as const;

function toOwner(row: {
  id: string;
  name: string;
  language: string | null;
  awaiting_input: string | null;
}): BotOwner {
  return {
    id: row.id,
    name: row.name,
    language: isBotLang(row.language) ? row.language : null,
    awaiting: row.awaiting_input,
  };
}

export async function getOwnerByChat(chatId: number): Promise<BotOwner | null> {
  const owner = await db().owner.findUnique({
    where: { telegram_chat_id: BigInt(chatId) },
    select: OWNER_SELECT,
  });
  return owner && toOwner(owner);
}

/**
 * Привязка по одноразовому коду. Код сразу становится недействительным.
 * Если этот чат был привязан к другому владельцу — отвязываем его.
 */
export async function linkOwnerByCode(
  code: string,
  chatId: number,
): Promise<BotOwner | null> {
  return db().$transaction(async (tx) => {
    const owner = await tx.owner.findUnique({
      where: { link_code: code },
      select: { id: true },
    });
    if (!owner) return null;

    await tx.owner.updateMany({
      where: { telegram_chat_id: BigInt(chatId), id: { not: owner.id } },
      data: { telegram_chat_id: null },
    });

    // Условие на link_code: если код успели использовать параллельно — строк не будет.
    const linked = await tx.owner.updateMany({
      where: { id: owner.id, link_code: code },
      data: { telegram_chat_id: BigInt(chatId), link_code: null },
    });
    if (linked.count === 0) return null;
    const row = await tx.owner.findUniqueOrThrow({
      where: { id: owner.id },
      select: OWNER_SELECT,
    });
    return toOwner(row);
  });
}

export async function setOwnerLanguage(ownerId: string, lang: BotLang) {
  await db().owner.update({ where: { id: ownerId }, data: { language: lang } });
}

export function ownerPlaces(ownerId: string): Promise<BotPlace[]> {
  return db().place.findMany({
    where: { owner_id: ownerId, status: { not: 'hidden' } },
    select: PLACE_SELECT,
    orderBy: { name_ru: 'asc' },
  });
}

/** Объект, только если он принадлежит этому владельцу. */
export function ownerPlace(
  ownerId: string,
  placeId: string,
): Promise<BotPlace | null> {
  return db().place.findFirst({
    where: { id: placeId, owner_id: ownerId },
    select: PLACE_SELECT,
  });
}

/**
 * Сохраняет отмеченные дни (неотмеченные не трогаем). У объекта с домиками —
 * всем домикам сразу (или одному, unitId), статус объекта пересчитывается.
 */
export async function saveStatuses(
  placeIds: string[],
  days: { date: IsoDate; status: AvailabilityStatus }[],
  unitId: string | null = null,
) {
  for (const placeId of placeIds) await saveDays(placeId, unitId, days);
}

export type OwnerLead = {
  id: string;
  name: string;
  phone: string;
  date_from: string | null;
  date_to: string | null;
  guests: number | null;
  comment: string | null;
  status: LeadStatus;
  created_at: string;
  place: BotPlace;
};

const LEAD_SELECT = {
  id: true,
  name: true,
  phone: true,
  date_from: true,
  date_to: true,
  guests: true,
  comment: true,
  status: true,
  created_at: true,
  place: { select: PLACE_SELECT },
} as const;

function toOwnerLead(row: {
  id: string;
  name: string;
  phone: string;
  date_from: Date | null;
  date_to: Date | null;
  guests: number | null;
  comment: string | null;
  status: LeadStatus;
  created_at: Date;
  place: BotPlace;
}): OwnerLead {
  return {
    ...row,
    date_from: isoDateOrNull(row.date_from),
    date_to: isoDateOrNull(row.date_to),
    created_at: row.created_at.toISOString(),
  };
}

export async function recentLeads(
  ownerId: string,
  limit = 10,
): Promise<OwnerLead[]> {
  const rows = await db().lead.findMany({
    where: { place: { owner_id: ownerId } },
    select: LEAD_SELECT,
    orderBy: { created_at: 'desc' },
    take: limit,
  });
  return rows.map(toOwnerLead);
}

/** Заявка, только если объект принадлежит этому владельцу. */
export async function ownerLead(
  ownerId: string,
  leadId: string,
): Promise<OwnerLead | null> {
  const row = await db().lead.findFirst({
    where: { id: leadId, place: { owner_id: ownerId } },
    select: LEAD_SELECT,
  });
  return row && toOwnerLead(row);
}

export async function setLeadStatus(leadId: string, status: LeadStatus) {
  await db().lead.update({ where: { id: leadId }, data: { status } });
}

export async function ownerStats(ownerId: string) {
  const [places, stats] = await Promise.all([
    db().place.findMany({
      where: { owner_id: ownerId, status: { not: 'hidden' } },
      select: { ...PLACE_SELECT, plan: true, pro_until: true },
      orderBy: { name_ru: 'asc' },
    }),
    placeStats(db()),
  ]);
  const today = toIsoDate(almatyToday(new Date()));
  const byId = new Map(stats.map((s) => [s.place_id, s]));
  return places.map(({ plan, pro_until, ...place }) => {
    const s = byId.get(place.id);
    return {
      place,
      views: s?.views_7 ?? 0,
      clicks: s?.whatsapp_7 ?? 0,
      leads: s?.leads_7 ?? 0,
      // Статистика в боте — возможность тарифа Pro (Этап 8).
      available: planFeatures(
        { plan, pro_until: isoDateOrNull(pro_until) },
        today,
      ).botStats,
    };
  });
}

/** Владельцы с ботом и хотя бы одним объектом — для напоминания. */
export async function ownersToRemind(): Promise<
  { chatId: number; language: BotLang | null }[]
> {
  const owners = await db().owner.findMany({
    where: {
      telegram_chat_id: { not: null },
      places: { some: { status: { not: 'hidden' } } },
    },
    select: { telegram_chat_id: true, language: true },
  });
  return owners.map((o) => ({
    chatId: Number(o.telegram_chat_id),
    language: isBotLang(o.language) ? o.language : null,
  }));
}

/** Куда отправить заявку: чат и язык владельца объекта. */
export async function placeOwnerChat(
  placeId: string,
): Promise<{ chatId: number; language: BotLang | null } | null> {
  const place = await db().place.findUnique({
    where: { id: placeId },
    select: { owner: { select: { telegram_chat_id: true, language: true } } },
  });
  const chatId = place?.owner?.telegram_chat_id;
  if (!chatId) return null;
  return {
    chatId: Number(chatId),
    language: isBotLang(place.owner!.language) ? place.owner!.language : null,
  };
}
