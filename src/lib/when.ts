import type { WhenOption } from "@/lib/catalog/filters";
import { addDays, type IsoDate, toIsoDate } from "./dates";
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

export function resolveWhen(when: WhenOption, now: Date): Stay {
  if (when === "this") return stayFromNights(getUpcomingWeekend(now).nights);
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
export function formatStay(stay: Stay, locale: string): string {
  const format = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
  return format.formatRange(day(stay.checkIn), day(stay.checkOut));
}
