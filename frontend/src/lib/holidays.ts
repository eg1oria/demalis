import { HOLIDAYS, type Holiday } from "@/config/holidays";
import { addDays, almatyToday, type IsoDate, toIsoDate } from "./dates";

const shift = (iso: IsoDate, days: number) =>
  toIsoDate(addDays(new Date(`${iso}T00:00:00Z`), days));

/** Ночь праздничная, если следующий день — праздничный выходной. */
export function isHolidayNight(
  night: IsoDate,
  holidays: Holiday[] = HOLIDAYS,
): boolean {
  const next = shift(night, 1);
  return holidays.some((h) => next >= h.from && next <= h.to);
}

/** Заезд накануне первого выходного, выезд — в последний. */
export function holidayStay(h: Holiday): {
  checkIn: IsoDate;
  checkOut: IsoDate;
} {
  return { checkIn: shift(h.from, -1), checkOut: h.to };
}

/** Ближайшие праздники для кнопок поиска: заезд ещё не прошёл и не дальше `days`. */
export function upcomingHolidays(
  now: Date,
  { days = 120, limit = 2, holidays = HOLIDAYS } = {},
): Holiday[] {
  const today = toIsoDate(almatyToday(now));
  const last = shift(today, days);
  return holidays
    .filter((h) => {
      const { checkIn } = holidayStay(h);
      return checkIn >= today && checkIn <= last;
    })
    .slice(0, limit);
}

/** Праздник, чей диапазон дат выбран в фильтре («2026-12-31_2027-01-03»). */
export function holidayForWhen(
  when: string,
  holidays: Holiday[] = HOLIDAYS,
): Holiday | null {
  return (
    holidays.find((h) => {
      const { checkIn, checkOut } = holidayStay(h);
      return when === `${checkIn}_${checkOut}`;
    }) ?? null
  );
}
