import {
  combineStatuses,
  type DisplayStatus,
  displayStatus,
  isAvailable,
} from "./availability";
import type { IsoDate } from "./dates";
import type { AvailabilityStatus } from "./places/constants";
import { type DayPrices, type StayPrice, stayPrice } from "./stayPrice";

/**
 * Статус и примерная цена объекта на несколько ночей (Этап 14):
 * выходные — пт и сб, будни, диапазон дат, праздники.
 */

/** Ответ GET /public/availability/nights. */
export type NightsResponse = {
  rows: {
    place_id: string;
    date: IsoDate;
    status: AvailabilityStatus;
    price: number | null;
    free_capacity: number | null;
  }[];
  unitRows: {
    unit_id: string;
    date: IsoDate;
    status: AvailabilityStatus;
    price: number | null;
  }[];
  freshness: { place_id: string; last_updated_at: string | null }[];
};

type NightRow = { status: AvailabilityStatus; price: number | null };

export type StayIndex = {
  places: Map<string, Map<IsoDate, NightRow & { freeCapacity: number | null }>>;
  units: Map<string, Map<IsoDate, NightRow>>;
  lastUpdated: Map<string, string | null>;
  now: Date;
};

export function indexNights(response: NightsResponse, now: Date): StayIndex {
  const places: StayIndex["places"] = new Map();
  for (const r of response.rows) {
    if (!places.has(r.place_id)) places.set(r.place_id, new Map());
    places.get(r.place_id)!.set(r.date, {
      status: r.status,
      price: r.price,
      freeCapacity: r.free_capacity,
    });
  }
  const units: StayIndex["units"] = new Map();
  for (const r of response.unitRows) {
    if (!units.has(r.unit_id)) units.set(r.unit_id, new Map());
    units.get(r.unit_id)!.set(r.date, { status: r.status, price: r.price });
  }
  return {
    places,
    units,
    lastUpdated: new Map(
      response.freshness.map((f) => [f.place_id, f.last_updated_at]),
    ),
    now,
  };
}

/** Объекты, о которых есть хоть какие-то данные (для карт статусов). */
export function knownPlaces(index: StayIndex): string[] {
  return [...new Set([...index.lastUpdated.keys(), ...index.places.keys()])];
}

/**
 * Статус на все ночи — худший из них. Гостей больше, чем мест в свободных
 * домиках, — для этой компании «Занято».
 */
export function stayStatus(
  index: StayIndex,
  placeId: string,
  nights: IsoDate[],
  guests?: number,
): DisplayStatus {
  const rows = index.places.get(placeId);
  const updatedAt = index.lastUpdated.get(placeId);
  const status = combineStatuses(
    nights.map((n) =>
      displayStatus(rows?.get(n)?.status, updatedAt, index.now),
    ),
  );
  if (!guests || !isAvailable(status)) return status;
  const capacities = nights
    .map((n) => rows?.get(n)?.freeCapacity)
    .filter((c): c is number => c != null);
  return capacities.length > 0 && Math.min(...capacities) < guests
    ? "full"
    : status;
}

export type UnitPrices = DayPrices & { id: string; capacity: number };

export type PricedPlace = DayPrices & {
  id: string;
  price_unit: "per_night_unit" | "per_person";
  units: UnitPrices[];
};

/** Цена за ночи + первая ночь (для подписи «31.12 · 85 000 ₸»). */
export type StayEstimate = StayPrice & { firstNight: IsoDate };

/**
 * Примерная цена за все ночи. С домиками — самый дешёвый домик, в который
 * помещаются гости и который не занят ни в одну из ночей.
 */
export function stayEstimate(
  place: PricedPlace,
  index: StayIndex,
  nights: IsoDate[],
  guests?: number,
): StayEstimate | null {
  if (nights.length === 0) return null;
  const placeRows = index.places.get(place.id);
  const placeOverrides = new Map<IsoDate, number>();
  for (const n of nights) {
    const price = placeRows?.get(n)?.price;
    if (price) placeOverrides.set(n, price);
  }
  const withNight = (p: StayPrice | null) =>
    p && { ...p, firstNight: nights[0] };

  if (place.units.length === 0)
    return withNight(stayPrice(place, nights, placeOverrides, guests));

  let best: StayPrice | null = null;
  for (const unit of place.units) {
    if (guests && unit.capacity < guests) continue;
    const rows = index.units.get(unit.id);
    if (nights.some((n) => rows?.get(n)?.status === "full")) continue;
    const overrides = new Map(placeOverrides);
    for (const n of nights) {
      const price = rows?.get(n)?.price;
      if (price) overrides.set(n, price);
    }
    const prices: DayPrices & { price_unit: PricedPlace["price_unit"] } = {
      price_from: place.price_from,
      price_weekday: unit.price_weekday ?? place.price_weekday,
      price_weekend: unit.price_weekend ?? place.price_weekend,
      price_holiday: unit.price_holiday ?? place.price_holiday,
      price_unit: place.price_unit,
    };
    const price = stayPrice(prices, nights, overrides, guests);
    if (price && (!best || price.total < best.total)) best = price;
  }
  return withNight(best);
}
