import { TIME_ZONE } from "@/config/site";

/** Календарная дата в формате YYYY-MM-DD (дата ночи = дата заезда). */
export type IsoDate = string;

const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Сегодняшняя дата по Алматы как полночь UTC — дальше считаем только календарные дни. */
export function almatyToday(now: Date): Date {
  return new Date(`${dateFormatter.format(now)}T00:00:00Z`);
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

export function toIsoDate(date: Date): IsoDate {
  return date.toISOString().slice(0, 10);
}

/** N календарных дней подряд начиная с сегодняшнего (по Алматы). */
export function nextDays(now: Date, count: number): IsoDate[] {
  const today = almatyToday(now);
  return Array.from({ length: count }, (_, i) => toIsoDate(addDays(today, i)));
}

/** Месяц в формате YYYY-MM (отчёты в админке). */
export type IsoMonth = string;

/** Месяц из адреса; мусор → текущий месяц по Алматы. */
export function parseMonth(value: unknown, now: Date): IsoMonth {
  if (typeof value === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(value))
    return value;
  return toIsoDate(almatyToday(now)).slice(0, 7);
}

export function shiftMonth(month: IsoMonth, delta: number): IsoMonth {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
}

/** Полночь календарной даты по Алматы как момент времени (UTC). */
export function almatyMidnight(date: IsoDate): Date {
  const utcMidnight = new Date(`${date}T00:00:00Z`);
  const offset = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    timeZoneName: "longOffset",
  })
    .formatToParts(utcMidnight)
    .find((p) => p.type === "timeZoneName")?.value; // «GMT+05:00»
  const match = offset?.match(/GMT([+-])(\d{2}):(\d{2})/);
  const minutes = match
    ? (match[1] === "-" ? -1 : 1) * (Number(match[2]) * 60 + Number(match[3]))
    : 0;
  return new Date(utcMidnight.getTime() - minutes * 60_000);
}

/** Границы месяца по Алматы: [from, to). */
export function monthRange(month: IsoMonth): { from: Date; to: Date } {
  return {
    from: almatyMidnight(`${month}-01`),
    to: almatyMidnight(`${shiftMonth(month, 1)}-01`),
  };
}
