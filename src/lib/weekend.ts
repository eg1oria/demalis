import { TIME_ZONE } from "@/config/site";

/** Календарная дата в формате YYYY-MM-DD (дата ночи = дата заезда). */
export type IsoDate = string;

export type UpcomingWeekend = {
  /** Ночи выходных по порядку: пятница и суббота, либо только суббота, если сегодня суббота. */
  nights: IsoDate[];
  /** Ночь субботы — по ней считается «Свободно на выходные». */
  saturday: IsoDate;
};

const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Сегодняшняя дата по Алматы как полночь UTC — дальше считаем только календарные дни. */
function almatyToday(now: Date): Date {
  return new Date(`${dateFormatter.format(now)}T00:00:00Z`);
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function toIsoDate(date: Date): IsoDate {
  return date.toISOString().slice(0, 10);
}

/**
 * Ближайшие выходные по часовому поясу Asia/Almaty:
 * - пн–пт — ближайшие пятница и суббота;
 * - суббота — только сегодняшняя ночь;
 * - воскресенье — следующие пятница и суббота.
 */
export function getUpcomingWeekend(now: Date): UpcomingWeekend {
  const today = almatyToday(now);
  const weekday = today.getUTCDay(); // 0 — воскресенье, 6 — суббота

  if (weekday === 6) {
    const saturday = toIsoDate(today);
    return { nights: [saturday], saturday };
  }

  const daysToFriday = (5 - weekday + 7) % 7;
  const friday = addDays(today, daysToFriday);
  const saturday = toIsoDate(addDays(friday, 1));
  return { nights: [toIsoDate(friday), saturday], saturday };
}
