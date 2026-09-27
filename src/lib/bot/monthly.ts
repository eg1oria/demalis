import "server-only";
import {
  almatyToday,
  type IsoMonth,
  monthRange,
  shiftMonth,
  toIsoDate,
} from "@/lib/dates";
import { effectivePlan } from "@/lib/plans";
import { createAdminClient } from "@/lib/supabase/admin";
import { createBotApi } from "@/lib/telegram/api";
import { type MonthCounts, monthlyReportMessage } from "./report";
import { type BotLang, isBotLang } from "./texts";

const EMPTY: MonthCounts = { views: 0, whatsapp: 0, leads: 0 };

/** Просмотры, клики WhatsApp и заявки по объектам за календарный месяц (по Алматы). */
export async function monthStats(
  month: IsoMonth,
): Promise<Map<string, MonthCounts>> {
  const { from, to } = monthRange(month);
  const { data, error } = await createAdminClient().rpc("place_stats_between", {
    p_from: from.toISOString(),
    p_to: to.toISOString(),
  });
  if (error) throw error;
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
    plan: "free" | "pro";
    pro_until: string | null;
    status: string;
  }[];
};

const OWNER_FIELDS =
  "id, telegram_chat_id, language, places (id, name_ru, name_kk, plan, pro_until, status)" as const;

function buildReport(
  owner: OwnerForReport,
  month: IsoMonth,
  current: Map<string, MonthCounts>,
  previous: Map<string, MonthCounts>,
  today: string,
): { text: string; lang: BotLang } | null {
  const places = owner.places
    .filter((p) => p.status !== "hidden")
    .sort((a, b) => a.name_ru.localeCompare(b.name_ru, "ru"));
  if (places.length === 0) return null;
  const lang: BotLang = isBotLang(owner.language) ? owner.language : "ru";
  // «Free-владелец» — ни одного объекта на Pro: ему в конце строка о Pro.
  const isFree = places.every((p) => effectivePlan(p, today) === "free");
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
  const supabase = createAdminClient();
  const [{ data: owner, error }, current, previous] = await Promise.all([
    supabase.from("owners").select(OWNER_FIELDS).eq("id", ownerId).single(),
    monthStats(month),
    monthStats(shiftMonth(month, -1)),
  ]);
  if (error) throw error;
  const today = toIsoDate(almatyToday(new Date()));
  const report = buildReport(owner, month, current, previous, today);
  return { owner, report };
}

/** Отправить отчёт одному владельцу (кнопка в админке). Не отмечает месяц как отправленный. */
export async function sendOwnerReport(
  ownerId: string,
  month: IsoMonth,
): Promise<"sent" | "no-chat" | "no-places" | "no-bot"> {
  const api = createBotApi();
  if (!api) return "no-bot";
  const { owner, report } = await ownerReport(ownerId, month);
  if (!owner.telegram_chat_id) return "no-chat";
  if (!report) return "no-places";
  await api.sendMessage(owner.telegram_chat_id, report.text);
  return "sent";
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
  const supabase = createAdminClient();
  const [{ data: owners, error }, current, previous] = await Promise.all([
    supabase
      .from("owners")
      .select(OWNER_FIELDS)
      .not("telegram_chat_id", "is", null)
      .or(`last_report_month.is.null,last_report_month.neq.${month}`),
    monthStats(month),
    monthStats(shiftMonth(month, -1)),
  ]);
  if (error) throw error;
  const today = toIsoDate(almatyToday(new Date()));

  let sent = 0;
  let failed = 0;
  for (const owner of owners) {
    const report = buildReport(owner, month, current, previous, today);
    if (!report || !owner.telegram_chat_id) continue;
    try {
      await api.sendMessage(owner.telegram_chat_id, report.text);
      const { error: markError } = await supabase
        .from("owners")
        .update({ last_report_month: month })
        .eq("id", owner.id);
      if (markError) throw markError;
      sent++;
    } catch (e) {
      // Например, владелец заблокировал бота — остальным всё равно отправляем.
      console.error("monthly report", owner.id, e);
      failed++;
    }
  }
  return { sent, failed };
}
