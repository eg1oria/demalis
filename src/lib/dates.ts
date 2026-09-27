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
