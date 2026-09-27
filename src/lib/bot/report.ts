import type { IsoMonth } from "@/lib/dates";
import { shiftMonth } from "@/lib/dates";
import { placeName } from "@/lib/places/present";
import { BOT_TEXTS, type BotLang } from "./texts";

/** Цифры объекта за месяц (как в «Статистике» админки за этот месяц). */
export type MonthCounts = { views: number; whatsapp: number; leads: number };

export type ReportRow = {
  place: { name_ru: string; name_kk: string | null };
  current: MonthCounts;
  previous: MonthCounts;
};

const monthIndex = (month: IsoMonth) => Number(month.slice(5, 7)) - 1;

/** «+14%», «−20%», «без изменений»; если раньше было 0 — без процентов. */
export function formatChange(
  current: number,
  previous: number,
  lang: BotLang,
): string | null {
  if (previous === 0) return null;
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return BOT_TEXTS[lang].reportNoChange;
  return `${pct > 0 ? "+" : "−"}${Math.abs(pct)}%`;
}

/**
 * Ежемесячный отчёт владельцу (Этап 9): прошлый месяц и сравнение
 * с позапрошлым. proLine — одна строка о Pro в конце (для Free).
 */
export function monthlyReportMessage({
  lang,
  month,
  rows,
  proLine,
}: {
  lang: BotLang;
  month: IsoMonth;
  rows: ReportRow[];
  proLine: boolean;
}): string {
  const t = BOT_TEXTS[lang];
  const prevName = t.months[monthIndex(shiftMonth(month, -1))];
  const line = (label: string, current: number, previous: number) => {
    const change = formatChange(current, previous, lang);
    return `${label}: ${current} (${prevName}: ${previous}${change ? `, ${change}` : ""})`;
  };

  const blocks = rows.map((row) =>
    [
      placeName(row.place, lang),
      line(t.reportViews, row.current.views, row.previous.views),
      line(t.reportClicks, row.current.whatsapp, row.previous.whatsapp),
      line(t.reportLeads, row.current.leads, row.previous.leads),
    ].join("\n"),
  );
  return [
    t.reportTitle(t.months[monthIndex(month)], Number(month.slice(0, 4))),
    ...blocks,
    ...(proLine ? [t.reportProLine] : []),
  ].join("\n\n");
}
