import { addDays, almatyToday, shiftMonth, toIsoDate } from '../shared/dates';
import { placeName } from '../shared/places/present';
import { proReminderDue } from '../shared/plans';
import { PRO_REMINDER_DAYS } from '../shared/pricing';
import { cleanupOrphanPhotos } from '../photos/cleanup';
import { db } from '../prisma/prisma';
import { dbDate, isoDate } from '../prisma/dates';
import { createBotApi } from '../telegram/api';
import { sendMonthlyReports } from './monthly';
import { sendWeeklyReminders } from './notify';
import { BOT_TEXTS, isBotLang } from './texts';

const THURSDAY = 4;
/** Отчёт за прошлый месяц — 1-го числа (2-го и 3-го — досылка, если cron не сработал). */
const MONTHLY_REPORT_LAST_DAY = 3;

const ruDate = (iso: string) =>
  `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}`;

/** Истёкший Pro → free. Дата окончания остаётся для истории. */
export async function expirePro(today: string): Promise<number> {
  const { count } = await db().place.updateMany({
    where: { plan: 'pro', pro_until: { lt: dbDate(today) } },
    data: { plan: 'free' },
  });
  return count;
}

/** Напоминание владельцу за PRO_REMINDER_DAYS дней до конца Pro — один раз на дату окончания. */
export async function remindProEnding(
  today: string,
): Promise<{ sent: number; failed: number }> {
  const api = createBotApi();
  if (!api) return { sent: 0, failed: 0 };
  const last = toIsoDate(
    addDays(new Date(`${today}T00:00:00Z`), PRO_REMINDER_DAYS),
  );
  const rows = await db().place.findMany({
    where: {
      plan: 'pro',
      pro_until: { gte: dbDate(today), lte: dbDate(last) },
      owner: { telegram_chat_id: { not: null } },
    },
    select: {
      id: true,
      name_ru: true,
      name_kk: true,
      plan: true,
      pro_until: true,
      pro_reminded_for: true,
      owner: { select: { telegram_chat_id: true, language: true } },
    },
  });
  const data = rows.map((p) => ({
    ...p,
    pro_until: p.pro_until && isoDate(p.pro_until),
    pro_reminded_for: p.pro_reminded_for && isoDate(p.pro_reminded_for),
    owner: {
      telegram_chat_id: Number(p.owner!.telegram_chat_id),
      language: p.owner!.language,
    },
  }));

  let sent = 0;
  let failed = 0;
  for (const place of data) {
    if (!proReminderDue(place, today) || !place.owner.telegram_chat_id)
      continue;
    const lang = isBotLang(place.owner.language) ? place.owner.language : 'ru';
    try {
      await api.sendMessage(
        place.owner.telegram_chat_id,
        BOT_TEXTS[lang].proEnding(
          placeName(place, lang),
          ruDate(place.pro_until!),
        ),
      );
      await db().place.update({
        where: { id: place.id },
        data: { pro_reminded_for: dbDate(place.pro_until!) },
      });
      sent++;
    } catch (e) {
      console.error('remindProEnding', place.id, e);
      failed++;
    }
  }
  return { sent, failed };
}

/** Ссылки для входа живут 15 минут; через сутки они не нужны даже для разбора. */
export async function cleanupLoginTokens(now: Date): Promise<number> {
  const { count } = await db().loginToken.deleteMany({
    where: {
      expires_at: { lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
    },
  });
  return count;
}

/**
 * Ежедневные задачи (CronService, 12:00 по Алматы):
 * истёкший Pro → free, напоминание о конце Pro, по четвергам — «обновите занятость»,
 * 1-го числа — отчёт владельцам за прошлый месяц (если запуск 1-го сорвался,
 * досылаем 2-го и 3-го: кому уже отправлено, повторно не придёт),
 * чистка старых ссылок для входа в админку и фото, которые не попали в объекты.
 */
export async function runDailyJobs(now: Date = new Date()) {
  const todayDate = almatyToday(now);
  const today = toIsoDate(todayDate);
  const expired = await expirePro(today);
  const proReminders = await remindProEnding(today);
  const weekly =
    todayDate.getUTCDay() === THURSDAY && createBotApi()
      ? await sendWeeklyReminders()
      : null;
  const monthly =
    todayDate.getUTCDate() <= MONTHLY_REPORT_LAST_DAY
      ? await sendMonthlyReports(shiftMonth(today.slice(0, 7), -1))
      : null;
  const loginTokens = await cleanupLoginTokens(now);
  const orphanPhotos = await cleanupOrphanPhotos(now);
  return {
    today,
    expired,
    proReminders,
    weekly,
    monthly,
    loginTokens,
    orphanPhotos,
  };
}
