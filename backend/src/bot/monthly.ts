import {
  almatyToday,
  type IsoMonth,
  monthRange,
  shiftMonth,
  toIsoDate,
} from '../shared/dates';
import { effectivePlan } from '../shared/plans';
import { placeStatsBetween } from '../common/stats';
import { db } from '../prisma/prisma';
import { isoDateOrNull } from '../prisma/dates';
import { createBotApi } from '../telegram/api';
import { type MonthCounts, monthlyReportMessage } from './report';
import { type BotLang, isBotLang } from './texts';

const EMPTY: MonthCounts = { views: 0, whatsapp: 0, leads: 0 };

/** Просмотры, клики WhatsApp и заявки по объектам за календарный месяц (по Алматы). */
export async function monthStats(
  month: IsoMonth,
): Promise<Map<string, MonthCounts>> {
  const { from, to } = monthRange(month);
  const data = await placeStatsBetween(db(), from, to);
  return new Map(
    data.map((r) => [
      r.place_id,
      { views: r.views, whatsapp: r.whatsapp, leads: r.leads },
    ]),
  );
}

type OwnerForReport = {
  id: string;
  telegram_chat_id: number | null;
  language: string | null;
  places: {
    id: string;
    name_ru: string;
    name_kk: string | null;
    plan: 'free' | 'pro';
    pro_until: string | null;
    status: string;
  }[];
};

const OWNER_SELECT = {
  id: true,
  telegram_chat_id: true,
  language: true,
  places: {
    select: {
      id: true,
      name_ru: true,
      name_kk: true,
      plan: true,
      pro_until: true,
      status: true,
    },
  },
} as const;

function toOwnerForReport(row: {
  id: string;
  telegram_chat_id: bigint | null;
  language: string | null;
  places: (Omit<OwnerForReport['places'][number], 'pro_until'> & {
    pro_until: Date | null;
  })[];
}): OwnerForReport {
  return {
    ...row,
    telegram_chat_id:
      row.telegram_chat_id === null ? null : Number(row.telegram_chat_id),
    places: row.places.map((p) => ({
      ...p,
      pro_until: isoDateOrNull(p.pro_until),
    })),
  };
}

function buildReport(
  owner: OwnerForReport,
  month: IsoMonth,
  current: Map<string, MonthCounts>,
  previous: Map<string, MonthCounts>,
  today: string,
): { text: string; lang: BotLang } | null {
  const places = owner.places
    .filter((p) => p.status !== 'hidden')
    .sort((a, b) => a.name_ru.localeCompare(b.name_ru, 'ru'));
  if (places.length === 0) return null;
  const lang: BotLang = isBotLang(owner.language) ? owner.language : 'ru';
  // «Free-владелец» — ни одного объекта на Pro: ему в конце строка о Pro.
  const isFree = places.every((p) => effectivePlan(p, today) === 'free');
  return {
    lang,
    text: monthlyReportMessage({
      lang,
      month,
      proLine: isFree,
      rows: places.map((place) => ({
        place,
        current: current.get(place.id) ?? EMPTY,
        previous: previous.get(place.id) ?? EMPTY,
      })),
    }),
  };
}

/** Текст отчёта владельцу за месяц — для предпросмотра и ручной отправки из админки. */
export async function ownerReport(ownerId: string, month: IsoMonth) {
  const [row, current, previous] = await Promise.all([
    db().owner.findUniqueOrThrow({
      where: { id: ownerId },
      select: OWNER_SELECT,
    }),
    monthStats(month),
    monthStats(shiftMonth(month, -1)),
  ]);
  const owner = toOwnerForReport(row);
  const today = toIsoDate(almatyToday(new Date()));
  const report = buildReport(owner, month, current, previous, today);
  return { owner, report };
}

/** Отправить отчёт одному владельцу (кнопка в админке). Не отмечает месяц как отправленный. */
export async function sendOwnerReport(
  ownerId: string,
  month: IsoMonth,
): Promise<'sent' | 'no-chat' | 'no-places' | 'no-bot'> {
  const api = createBotApi();
  if (!api) return 'no-bot';
  const { owner, report } = await ownerReport(ownerId, month);
  if (!owner.telegram_chat_id) return 'no-chat';
  if (!report) return 'no-places';
  await api.sendMessage(owner.telegram_chat_id, report.text);
  return 'sent';
}

/**
 * Автоматическая рассылка за месяц всем владельцам с ботом (ежедневный cron,
 * 1-го числа). Кому уже отправлено за этот месяц — пропускаем.
 */
export async function sendMonthlyReports(
  month: IsoMonth,
): Promise<{ sent: number; failed: number }> {
  const api = createBotApi();
  if (!api) return { sent: 0, failed: 0 };
  const [rows, current, previous] = await Promise.all([
    db().owner.findMany({
      where: {
        telegram_chat_id: { not: null },
        OR: [
          { last_report_month: null },
          { last_report_month: { not: month } },
        ],
      },
      select: OWNER_SELECT,
    }),
    monthStats(month),
    monthStats(shiftMonth(month, -1)),
  ]);
  const owners = rows.map(toOwnerForReport);
  const today = toIsoDate(almatyToday(new Date()));

  let sent = 0;
  let failed = 0;
  for (const owner of owners) {
    const report = buildReport(owner, month, current, previous, today);
    if (!report || !owner.telegram_chat_id) continue;
    try {
      await api.sendMessage(owner.telegram_chat_id, report.text);
      await db().owner.update({
        where: { id: owner.id },
        data: { last_report_month: month },
      });
      sent++;
    } catch (e) {
      // Например, владелец заблокировал бота — остальным всё равно отправляем.
      console.error('monthly report', owner.id, e);
      failed++;
    }
  }
  return { sent, failed };
}
