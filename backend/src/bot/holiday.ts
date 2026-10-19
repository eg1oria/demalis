import { InlineKeyboard } from 'grammy';
import { addDays, type IsoDate, toIsoDate } from '../shared/dates';
import {
  AVAILABILITY_STATUSES,
  type AvailabilityStatus,
} from '../shared/places/constants';
import { placeName } from '../shared/places/present';
import { db } from '../prisma/prisma';
import { dbDate } from '../prisma/dates';
import { createBotApi } from '../telegram/api';
import { buildCallback } from './callbacks';
import { BOT_TEXTS, type BotLang, isBotLang } from './texts';

/**
 * Опрос владельцев про праздничную ночь (Новый год): статус кнопками,
 * потом цена текстом. Цена — availability.price на эту ночь.
 */

/** Границы цены за ночь, ₸ (как CHECK в базе). */
export const NIGHT_PRICE_MIN = 1000;
export const NIGHT_PRICE_MAX = 5_000_000;

/** «80 000 ₸», «80000», «80 000 тг» → 80000. Не число или вне границ → null. */
export function parseNightPrice(text: string): number | null {
  const digits = text
    .replace(/[\s  ]/g, '')
    .replace(/(₸|тг\.?|тенге|теңге|kzt)$/i, '');
  if (!/^\d+$/.test(digits)) return null;
  const price = Number(digits);
  return price >= NIGHT_PRICE_MIN && price <= NIGHT_PRICE_MAX ? price : null;
}

export function isNightPrice(value: unknown): value is number {
  return (
    Number.isInteger(value) &&
    (value as number) >= NIGHT_PRICE_MIN &&
    (value as number) <= NIGHT_PRICE_MAX
  );
}

/** Что бот ждёт от владельца: цену за ночь у объекта (owners.awaiting_input). */
export type AwaitingPrice = { placeId: string; night: IsoDate };

export const encodeAwaiting = ({ placeId, night }: AwaitingPrice) =>
  `price:${placeId}:${night}`;

export function decodeAwaiting(value: string | null): AwaitingPrice | null {
  const match = value?.match(/^price:([0-9a-f-]{36}):(\d{4}-\d{2}-\d{2})$/);
  return match ? { placeId: match[1], night: match[2] } : null;
}

/** «31.12 → 01.01» — ночь с заездом и выездом. */
export function nightLabel(night: IsoDate): string {
  const short = (iso: IsoDate) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}`;
  const next = toIsoDate(addDays(new Date(`${night}T00:00:00Z`), 1));
  return `${short(night)} → ${short(next)}`;
}

export function holidayKeyboard(
  placeId: string,
  night: IsoDate,
  lang: BotLang,
): InlineKeyboard {
  const labels: Record<AvailabilityStatus, string> = {
    free: `🟢 ${BOT_TEXTS[lang].statuses.free}`,
    limited: `🟡 ${BOT_TEXTS[lang].statuses.limited}`,
    full: `🔴 ${BOT_TEXTS[lang].statuses.full}`,
  };
  const keyboard = new InlineKeyboard();
  for (const status of Object.keys(
    AVAILABILITY_STATUSES,
  ) as AvailabilityStatus[])
    keyboard.text(
      labels[status],
      buildCallback({ kind: 'holiday', placeId, night, status }),
    );
  return keyboard;
}

export function skipPriceKeyboard(
  placeId: string,
  night: IsoDate,
  lang: BotLang,
): InlineKeyboard {
  return new InlineKeyboard().text(
    BOT_TEXTS[lang].holidaySkip,
    buildCallback({ kind: 'holidaySkip', placeId, night }),
  );
}

export async function setAwaiting(ownerId: string, value: string | null) {
  await db().owner.update({
    where: { id: ownerId },
    data: { awaiting_input: value },
  });
}

/** Цена за ночь; строки занятости нет — не создаём (сначала статус). */
export async function saveNightPrice(
  placeId: string,
  night: IsoDate,
  price: number | null,
): Promise<boolean> {
  const { count } = await db().availability.updateMany({
    where: { place_id: placeId, date: dbDate(night) },
    data: { price },
  });
  return count > 0;
}

/**
 * Рассылка опроса: каждому владельцу с ботом — по сообщению на каждый
 * опубликованный объект. Ошибка у одного владельца не мешает остальным.
 */
export async function sendHolidaySurvey(
  night: IsoDate,
): Promise<{ sent: number; failed: number }> {
  const api = createBotApi();
  if (!api) throw new Error('Не задан TELEGRAM_BOT_TOKEN');
  const places = await db().place.findMany({
    where: {
      status: 'published',
      owner: { telegram_chat_id: { not: null } },
    },
    select: {
      id: true,
      name_ru: true,
      name_kk: true,
      owner: { select: { telegram_chat_id: true, language: true } },
    },
    orderBy: { name_ru: 'asc' },
  });

  let sent = 0;
  let failed = 0;
  for (const place of places) {
    const lang = isBotLang(place.owner!.language)
      ? place.owner!.language
      : 'ru';
    const t = BOT_TEXTS[lang];
    try {
      await api.sendMessage(
        Number(place.owner!.telegram_chat_id),
        t.holidayAsk(
          placeName(place, lang),
          t.holidayTitle(night),
          nightLabel(night),
        ),
        { reply_markup: holidayKeyboard(place.id, night, lang) },
      );
      sent++;
    } catch (e) {
      // Например, владелец заблокировал бота.
      console.error('holiday survey', place.id, e);
      failed++;
    }
  }
  return { sent, failed };
}

export type HolidayRow = {
  place_id: string;
  name_ru: string;
  slug: string;
  owner_name: string | null;
  bot_linked: boolean;
  status: AvailabilityStatus | null;
  price: number | null;
  updated_at: Date | null;
};

/** Ответы на опрос для админки: все опубликованные объекты и их статус на ночь. */
export async function holidayRows(night: IsoDate): Promise<HolidayRow[]> {
  const places = await db().place.findMany({
    where: { status: 'published' },
    select: {
      id: true,
      name_ru: true,
      slug: true,
      owner: { select: { name: true, telegram_chat_id: true } },
      availability: {
        where: { date: dbDate(night) },
        select: { status: true, price: true, updated_at: true },
      },
    },
    orderBy: { name_ru: 'asc' },
  });
  return places.map((p) => {
    const row = p.availability[0];
    return {
      place_id: p.id,
      name_ru: p.name_ru,
      slug: p.slug,
      owner_name: p.owner?.name ?? null,
      bot_linked: Boolean(p.owner?.telegram_chat_id),
      status: row?.status ?? null,
      price: row?.price ?? null,
      updated_at: row?.updated_at ?? null,
    };
  });
}

/** Админ отмечает ночь за владельца (например, после звонка). */
export async function setHolidayNight(
  placeId: string,
  night: IsoDate,
  status: AvailabilityStatus | null,
  price: number | null,
): Promise<void> {
  const key = { place_id: placeId, date: dbDate(night) };
  if (!status) {
    await db().availability.deleteMany({ where: key });
    return;
  }
  const now = new Date();
  await db().availability.upsert({
    where: { place_id_date: key },
    create: { ...key, status, price, updated_at: now },
    update: { status, price, updated_at: now },
  });
}
