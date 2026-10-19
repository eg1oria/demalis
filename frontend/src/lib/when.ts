import { parseRange, type WhenOption } from "@/lib/catalog/filters";
import { addDays, almatyToday, type IsoDate, toIsoDate } from "./dates";
import { holidayForWhen } from "./holidays";
import { getUpcomingWeekend } from "./weekend";

/** Выбор дат из фильтра → ночи и даты заезда/выезда. */
export type Stay = {
  nights: IsoDate[];
  checkIn: IsoDate;
  checkOut: IsoDate;
};

const day = (iso: IsoDate) => new Date(`${iso}T00:00:00Z`);

function stayFromNights(nights: IsoDate[]): Stay {
  return {
    nights,
    checkIn: nights[0],
    checkOut: toIsoDate(addDays(day(nights[nights.length - 1]), 1)),
  };
}

/** Ночи заезда с checkIn до checkOut (не включая выезд). */
export function nightsOf(checkIn: IsoDate, checkOut: IsoDate): IsoDate[] {
  const nights: IsoDate[] = [];
  for (let d = day(checkIn); toIsoDate(d) < checkOut; d = addDays(d, 1))
    nights.push(toIsoDate(d));
  return nights;
}

/** Будни: ближайшие пн → ср (две ночи); в понедельник — с сегодняшнего. */
export function upcomingWeekdays(now: Date): Stay {
  const today = almatyToday(now);
  const toMonday = (8 - today.getUTCDay()) % 7; // 0 — сегодня понедельник
  const monday = addDays(today, toMonday);
  return stayFromNights([toIsoDate(monday), toIsoDate(addDays(monday, 1))]);
}

export function resolveWhen(when: WhenOption, now: Date): Stay {
  if (when === "this") return stayFromNights(getUpcomingWeekend(now).nights);
  if (when === "weekdays") return upcomingWeekdays(now);
  const range = parseRange(when);
  if (range) return stayFromNights(nightsOf(range.checkIn, range.checkOut));
  if (when === "next") {
    const saturday = addDays(day(getUpcomingWeekend(now).saturday), 7);
    return stayFromNights([
      toIsoDate(addDays(saturday, -1)),
      toIsoDate(saturday),
    ]);
  }
  return stayFromNights([when]);
}

/** «2–4 окт.» — даты пребывания (заезд–выезд). */
export function formatStay(
  stay: Pick<Stay, "checkIn" | "checkOut">,
  locale: string,
): string {
  const format = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
  // Через Новый год formatRange дописывает годы — короче без них.
  if (stay.checkIn.slice(0, 4) !== stay.checkOut.slice(0, 4))
    return `${format.format(day(stay.checkIn))} – ${format.format(day(stay.checkOut))}`;
  return format.formatRange(day(stay.checkIn), day(stay.checkOut));
}

/**
 * Название выбора дат для подписи: «Эти выходные», «Будни», «Новый год».
 * Ключ перевода: Catalog.when_* или Holidays.<id>; null — просто даты.
 */
export function whenTitleKey(
  when: WhenOption,
): { ns: "Catalog" | "Holidays"; key: string } | null {
  if (when === "this" || when === "next" || when === "weekdays")
    return { ns: "Catalog", key: `when_${when}` };
  const holiday = holidayForWhen(when);
  return holiday ? { ns: "Holidays", key: holiday.id } : null;
}
