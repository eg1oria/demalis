import "server-only";
import { addDays, almatyToday, shiftMonth, toIsoDate } from "@/lib/dates";
import { placeName } from "@/lib/places/present";
import { proReminderDue } from "@/lib/plans";
import { PRO_REMINDER_DAYS } from "@/config/pricing";
import { createAdminClient } from "@/lib/supabase/admin";
import { createBotApi } from "@/lib/telegram/api";
import { sendMonthlyReports } from "./monthly";
import { sendWeeklyReminders } from "./notify";
import { BOT_TEXTS, isBotLang } from "./texts";

const THURSDAY = 4;
/** Отчёт за прошлый месяц — 1-го числа (2-го и 3-го — досылка, если cron не сработал). */
const MONTHLY_REPORT_LAST_DAY = 3;

const ruDate = (iso: string) =>
  `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}`;

/** Истёкший Pro → free. Дата окончания остаётся для истории. */
export async function expirePro(today: string): Promise<number> {
  const { data, error } = await createAdminClient()
    .from("places")
    .update({ plan: "free" })
    .eq("plan", "pro")
    .lt("pro_until", today)
    .select("id");
  if (error) throw error;
  return data.length;
}

/** Напоминание владельцу за PRO_REMINDER_DAYS дней до конца Pro — один раз на дату окончания. */
export async function remindProEnding(
  today: string,
): Promise<{ sent: number; failed: number }> {
  const api = createBotApi();
  if (!api) return { sent: 0, failed: 0 };
  const supabase = createAdminClient();
  const last = toIsoDate(
    addDays(new Date(`${today}T00:00:00Z`), PRO_REMINDER_DAYS),
  );
  const { data, error } = await supabase
    .from("places")
    .select(
      "id, name_ru, name_kk, plan, pro_until, pro_reminded_for, owner:owners!inner (telegram_chat_id, language)",
    )
    .eq("plan", "pro")
    .gte("pro_until", today)
    .lte("pro_until", last)
    .not("owner.telegram_chat_id", "is", null);
  if (error) throw error;

  let sent = 0;
  let failed = 0;
  for (const place of data) {
    if (!proReminderDue(place, today) || !place.owner.telegram_chat_id)
      continue;
    const lang = isBotLang(place.owner.language) ? place.owner.language : "ru";
    try {
      await api.sendMessage(
        place.owner.telegram_chat_id,
        BOT_TEXTS[lang].proEnding(
          placeName(place, lang),
          ruDate(place.pro_until!),
        ),
      );
      const { error: markError } = await supabase
        .from("places")
        .update({ pro_reminded_for: place.pro_until })
        .eq("id", place.id);
      if (markError) throw markError;
      sent++;
    } catch (e) {
      console.error("remindProEnding", place.id, e);
      failed++;
    }
  }
  return { sent, failed };
}

/**
 * Ежедневные задачи (Vercel Cron, 12:00 по Алматы):
 * истёкший Pro → free, напоминание о конце Pro, по четвергам — «обновите занятость»,
 * 1-го числа — отчёт владельцам за прошлый месяц (если запуск 1-го сорвался,
 * досылаем 2-го и 3-го: кому уже отправлено, повторно не придёт).
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
  return { today, expired, proReminders, weekly, monthly };
}
