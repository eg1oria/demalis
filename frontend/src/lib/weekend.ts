import { addDays, almatyToday, type IsoDate, toIsoDate } from "./dates";

export type UpcomingWeekend = {
  /** Ночи выходных по порядку: пятница и суббота, либо только суббота, если сегодня суббота. */
  nights: IsoDate[];
  /** Ночь субботы — по ней считается «Свободно на выходные». */
  saturday: IsoDate;
};

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
