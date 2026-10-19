import type { AvailabilityStatus } from "@/lib/places/constants";
import { type IsoDate } from "./dates";

/**
 * Что показываем гостю:
 * - free / limited / full — владелец отметил дату, данные свежие;
 * - stale — данные есть, но владелец не обновлял занятость больше 7 дней;
 * - unknown — на эту дату владелец ничего не отмечал.
 * stale и unknown выглядят одинаково: «Уточняйте наличие».
 */
export type DisplayStatus = AvailabilityStatus | "stale" | "unknown";

export const STALE_AFTER_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Данные устарели: последнее обновление занятости больше 7 дней назад. */
export function isStale(
  lastUpdatedAt: string | null | undefined,
  now: Date,
): boolean {
  if (!lastUpdatedAt) return true;
  return (
    now.getTime() - new Date(lastUpdatedAt).getTime() >
    STALE_AFTER_DAYS * DAY_MS
  );
}

/** Статус одной ночи с учётом свежести данных объекта. */
export function displayStatus(
  status: AvailabilityStatus | null | undefined,
  lastUpdatedAt: string | null | undefined,
  now: Date,
): DisplayStatus {
  if (!status) return "unknown";
  if (isStale(lastUpdatedAt, now)) return "stale";
  return status;
}

/** Можно ехать: «Свободно» или «Мало мест» при свежих данных. */
export function isAvailable(status: DisplayStatus): boolean {
  return status === "free" || status === "limited";
}

/**
 * Ночь, по которой решаем «свободно / занято» для выбора дат:
 * для выходных — суббота (раздел 4 ТЗ), для конкретной даты — она сама.
 */
export function keyNight(nights: IsoDate[]): IsoDate {
  return nights[nights.length - 1];
}

/** Сколько полных дней прошло с обновления (для подписи «обновлено N дней назад»). */
export function daysSince(updatedAt: string, now: Date): number {
  return Math.max(
    0,
    Math.floor((now.getTime() - new Date(updatedAt).getTime()) / DAY_MS),
  );
}
