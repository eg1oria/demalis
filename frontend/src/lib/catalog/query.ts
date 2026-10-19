import "server-only";
import {
  type DisplayStatus,
  displayStatus,
  isAvailable,
  keyNight,
} from "@/lib/availability";
import { almatyToday, type IsoDate, toIsoDate } from "@/lib/dates";
import type { AvailabilityStatus } from "@/lib/places/constants";
import { planFeatures, promote } from "@/lib/plans";
import { api, apiOrNull, query } from "@/lib/api/client";
import type { Tables } from "@/lib/api/types";
import { getUpcomingWeekend } from "@/lib/weekend";
import { resolveWhen } from "@/lib/when";
import {
  AMENITY_FILTERS,
  type CatalogFilters,
  onlyFree,
  PRICE_RANGES,
} from "./filters";

export type PlaceCardData = Pick<
  Tables<"places">,
  | "id"
  | "slug"
  | "name_ru"
  | "name_kk"
  | "type"
  | "direction"
  | "drive_minutes"
  | "price_from"
  | "price_unit"
  | "capacity_max"
  | "photos"
  | "photos_permission"
  | "has_banya"
  | "has_chan"
  | "has_pool"
  | "pets_allowed"
  | "has_kitchen"
  | "has_bbq"
  | "winter_ok"
  | "has_wifi"
  | "lat"
  | "lng"
  | "plan"
  | "pro_until"
  | "featured_until"
> & {
  /** Статус на выбранную ночь; нет — даты не выбраны. */
  status?: DisplayStatus;
  /** Цена владельца за выбранную ночь (праздники), если на неё есть места. */
  nightPrice?: { night: IsoDate; price: number };
  /** Плашка «Проверено» (тариф Pro). */
  verified?: boolean;
  /** Продвижение в первом экране «рекомендуемых» — пометка «Реклама». */
  promoted?: true;
};

/** Поля карточки (CARD_SELECT в backend/src/common/place-data.ts). */
type PlaceCardRow = Omit<
  PlaceCardData,
  "status" | "verified" | "promoted" | "nightPrice"
>;

export type CatalogResult = {
  /** Страница списка (с учётом «Показать ещё»). */
  places: PlaceCardData[];
  /** Все найденные — для карты. */
  all: PlaceCardData[];
  total: number;
  /** Ночь, по которой считали статус (суббота или выбранная дата). */
  night: IsoDate | null;
};

export async function findPlaces(
  filters: CatalogFilters,
  now: Date = new Date(),
): Promise<CatalogResult> {
  const range = filters.price ? PRICE_RANGES[filters.price] : null;
  // Условия и сортировку (кроме «рекомендуемых») применяет бэкенд, до 1000 объектов.
  const data = await api<PlaceCardRow[]>(
    `/public/places${query({
      drive: filters.drive,
      guests: filters.guests,
      price_min: range?.min,
      price_max: range?.max,
      amenities: filters.amenities.map((a) => AMENITY_FILTERS[a]).join(","),
      type: filters.type,
      dir: filters.dir,
      sort: filters.sort,
    })}`,
  );

  const today = toIsoDate(almatyToday(now));
  let all: PlaceCardData[] = data.map((place) => ({
    ...place,
    verified: planFeatures(place, today).verified,
  }));
  let night: IsoDate | null = null;

  if (filters.when) {
    night = keyNight(resolveWhen(filters.when, now).nights);
    const { statuses, prices } = await nightData(night, now);
    all = all.map((place) => {
      const status = placeStatus(place, statuses, today);
      const price = prices.get(place.id);
      return {
        ...place,
        status,
        ...(price &&
          isAvailable(status) && { nightPrice: { night: night!, price } }),
      };
    });
    if (onlyFree(filters)) all = all.filter((p) => isAvailable(p.status!));
  }
  if (filters.sort === "recommended") all = promote(all, today);

  return { places: all.slice(0, filters.limit), all, total: all.length, night };
}

/**
 * Статус, который видит гость. У тарифа без календаря (free) — всегда
 * «Уточняйте наличие», даже если владелец отмечает даты.
 */
export function placeStatus(
  place: Pick<Tables<"places">, "id" | "plan" | "pro_until">,
  statuses: Map<string, DisplayStatus>,
  today: IsoDate,
): DisplayStatus {
  if (!planFeatures(place, today).availability) return "unknown";
  return statuses.get(place.id) ?? "unknown";
}

/** Статусы всех опубликованных объектов на одну ночь (RLS не отдаст черновики). */
export async function statusesForNight(
  night: IsoDate,
  now: Date,
): Promise<Map<string, DisplayStatus>> {
  return (await nightData(night, now)).statuses;
}

/** Статусы и цены владельцев (праздники) на одну ночь. */
async function nightData(
  night: IsoDate,
  now: Date,
): Promise<{
  statuses: Map<string, DisplayStatus>;
  prices: Map<string, number>;
}> {
  const { rows, freshness } = await api<{
    rows: {
      place_id: string;
      status: AvailabilityStatus;
      price: number | null;
    }[];
    freshness: { place_id: string; last_updated_at: string | null }[];
  }>(`/public/availability/night/${night}`);

  const lastUpdated = new Map(
    freshness.map((r) => [r.place_id, r.last_updated_at] as const),
  );
  const statuses = new Map<string, DisplayStatus>();
  const prices = new Map<string, number>();
  for (const [placeId, updatedAt] of lastUpdated) {
    if (placeId) statuses.set(placeId, displayStatus(null, updatedAt, now));
  }
  for (const row of rows) {
    statuses.set(
      row.place_id,
      displayStatus(row.status, lastUpdated.get(row.place_id), now),
    );
    if (row.price) prices.set(row.place_id, row.price);
  }
  return { statuses, prices };
}

export async function getPlaceBySlug(slug: string) {
  return apiOrNull<Tables<"places">>(
    `/public/places/by-slug/${encodeURIComponent(slug)}`,
  );
}

/** Занятость объекта на период + когда владелец последний раз обновлял. */
export async function getPlaceAvailability(
  placeId: string,
  from: IsoDate,
  to: IsoDate,
): Promise<{
  days: Record<IsoDate, AvailabilityStatus>;
  lastUpdatedAt: string | null;
}> {
  return api(`/public/places/${placeId}/availability${query({ from, to })}`);
}

/** Похожие: то же направление, потом тот же тип. */
export async function findSimilar(
  place: Pick<Tables<"places">, "id" | "direction" | "type">,
  limit = 4,
): Promise<PlaceCardData[]> {
  const data =
    (await apiOrNull<PlaceCardRow[]>(`/public/places/${place.id}/similar`)) ??
    [];
  return [...data]
    .sort(
      (a, b) =>
        Number(b.direction === place.direction) -
        Number(a.direction === place.direction),
    )
    .slice(0, limit);
}

/**
 * Объекты для «Избранного» в порядке сохранения, со статусом на эту субботу.
 * Снятые с публикации просто пропадают из списка.
 */
export async function findPlacesByIds(
  ids: string[],
  now: Date = new Date(),
): Promise<PlaceCardData[]> {
  if (ids.length === 0) return [];
  const data = await api<PlaceCardRow[]>(
    `/public/places/by-ids${query({ ids: ids.join(",") })}`,
  );

  const today = toIsoDate(almatyToday(now));
  const statuses = await statusesForNight(
    getUpcomingWeekend(now).saturday,
    now,
  );
  const order = new Map(ids.map((id, i) => [id, i]));
  return data
    .map((place) => ({
      ...place,
      verified: planFeatures(place, today).verified,
      status: placeStatus(place, statuses, today),
    }))
    .sort((a, b) => order.get(a.id)! - order.get(b.id)!);
}
