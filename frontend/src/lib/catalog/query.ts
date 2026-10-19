import "server-only";
import { type DisplayStatus, isAvailable } from "@/lib/availability";
import { almatyToday, type IsoDate, toIsoDate } from "@/lib/dates";
import type { AvailabilityStatus } from "@/lib/places/constants";
import { planFeatures, promote } from "@/lib/plans";
import {
  indexNights,
  knownPlaces,
  type NightsResponse,
  type StayEstimate,
  type StayIndex,
  stayEstimate,
  stayStatus,
} from "@/lib/stay";
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
  | "price_weekday"
  | "price_weekend"
  | "price_holiday"
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
  | "review_count"
  | "rating_avg"
> & {
  /** Домики (Этап 14): вместимость и цены; пусто — объект целиком. */
  units: UnitCardData[];
  /** Статус на выбранные ночи; нет — даты не выбраны. */
  status?: DisplayStatus;
  /** Примерная цена за выбранные ночи (цены по дням, праздники, домики). */
  stayPrice?: StayEstimate;
  /** Плашка «Проверено» (тариф Pro). */
  verified?: boolean;
  /** Продвижение в первом экране «рекомендуемых» — пометка «Реклама». */
  promoted?: true;
};

/** Поля карточки (CARD_SELECT в backend/src/common/place-data.ts). */
type PlaceCardRow = Omit<
  PlaceCardData,
  "status" | "verified" | "promoted" | "stayPrice"
>;

export type UnitCardData = Pick<
  Tables<"units">,
  | "id"
  | "name_ru"
  | "name_kk"
  | "capacity"
  | "price_weekday"
  | "price_weekend"
  | "price_holiday"
>;

export type CatalogResult = {
  /** Страница списка (с учётом «Показать ещё»). */
  places: PlaceCardData[];
  /** Все найденные — для карты. */
  all: PlaceCardData[];
  total: number;
  /** Ночи, по которым считали статус (выходные, будни, диапазон); null — без дат. */
  nights: IsoDate[] | null;
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
  let nights: IsoDate[] | null = null;

  if (filters.when) {
    nights = resolveWhen(filters.when, now).nights;
    const index = await stayIndex(nights, now);
    all = all.map((place) => {
      const status = placeStayStatus(
        place,
        index,
        nights!,
        today,
        filters.guests,
      );
      const price =
        status !== "full"
          ? stayEstimate(place, index, nights!, filters.guests)
          : null;
      return { ...place, status, ...(price && { stayPrice: price }) };
    });
    if (onlyFree(filters)) all = all.filter((p) => isAvailable(p.status!));
  }
  if (filters.sort === "recommended") all = promote(all, today);

  return {
    places: all.slice(0, filters.limit),
    all,
    total: all.length,
    nights,
  };
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

function placeStayStatus(
  place: Pick<Tables<"places">, "id" | "plan" | "pro_until">,
  index: StayIndex,
  nights: IsoDate[],
  today: IsoDate,
  guests?: number,
): DisplayStatus {
  if (!planFeatures(place, today).availability) return "unknown";
  return stayStatus(index, place.id, nights, guests);
}

/** Занятость на ночи (по порядку, подряд); placeId — только один объект. */
export async function stayIndex(
  nights: IsoDate[],
  now: Date,
  placeId?: string,
): Promise<StayIndex> {
  const response = await api<NightsResponse>(
    `/public/availability/nights${query({
      from: nights[0],
      to: nights[nights.length - 1],
      place: placeId,
    })}`,
  );
  return indexNights(response, now);
}

/** Статусы всех опубликованных объектов на ночи (худший из ночей). */
export async function statusesForStay(
  nights: IsoDate[],
  now: Date,
): Promise<Map<string, DisplayStatus>> {
  const index = await stayIndex(nights, now);
  return new Map(
    knownPlaces(index).map((id) => [id, stayStatus(index, id, nights)]),
  );
}

/** Опубликованный отзыв на странице объекта (имя — без фамилии). */
export type PublicReview = Pick<
  Tables<"reviews">,
  "id" | "author_name" | "text" | "stay_date" | "published_at"
> & { rating: number };

export type PlaceWithUnits = Tables<"places"> & {
  units: UnitCardData[];
  reviews: PublicReview[];
};

export async function getPlaceBySlug(slug: string) {
  return apiOrNull<PlaceWithUnits>(
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
  const statuses = await statusesForStay(getUpcomingWeekend(now).nights, now);
  const order = new Map(ids.map((id, i) => [id, i]));
  return data
    .map((place) => ({
      ...place,
      verified: planFeatures(place, today).verified,
      status: placeStatus(place, statuses, today),
    }))
    .sort((a, b) => order.get(a.id)! - order.get(b.id)!);
}
