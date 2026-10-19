import type { IsoDate } from "./dates";
import { isHolidayNight } from "./holidays";

/** Цены объекта или домика, ₸ за ночь. null — не указана. */
export type DayPrices = {
  price_from?: number | null;
  price_weekday: number | null;
  price_weekend: number | null;
  price_holiday: number | null;
};

/** Ночи пятницы и субботы — выходные. */
export const isWeekendNight = (night: IsoDate) => {
  const day = new Date(`${night}T00:00:00Z`).getUTCDay();
  return day === 5 || day === 6;
};

/**
 * Цена одной ночи: в праздник — праздничная, в пт и сб — выходная, иначе
 * будничная. Если нужной нет — ближайшая по смыслу (праздник → выходные →
 * «от» → будни).
 */
export function nightPrice(p: DayPrices, night: IsoDate): number | null {
  const from = p.price_from ?? null;
  const chain = isHolidayNight(night)
    ? [p.price_holiday, p.price_weekend, from, p.price_weekday]
    : isWeekendNight(night)
      ? [p.price_weekend, from, p.price_weekday]
      : [p.price_weekday, from, p.price_weekend];
  return chain.find((price) => price != null) ?? null;
}

export type StayPrice = {
  /** Сумма за все ночи (за человека — уже умножено на гостей, если они известны). */
  total: number;
  nights: number;
  /** Цена «за человека», а гостей не знаем — total указан за одного. */
  perPersonUnknownGuests: boolean;
};

/**
 * Сколько примерно стоят ночи. overrides — цена владельца на конкретную ночь
 * (праздники, availability.price). Нет цены хоть на одну ночь → null.
 */
export function stayPrice(
  p: DayPrices & { price_unit?: "per_night_unit" | "per_person" },
  nights: IsoDate[],
  overrides: Map<IsoDate, number> = new Map(),
  guests?: number,
): StayPrice | null {
  if (nights.length === 0) return null;
  let total = 0;
  for (const night of nights) {
    const price = overrides.get(night) ?? nightPrice(p, night);
    if (price == null) return null;
    total += price;
  }
  const perPerson = p.price_unit === "per_person";
  return {
    total: perPerson && guests ? total * guests : total,
    nights: nights.length,
    perPersonUnknownGuests: perPerson && !guests,
  };
}
