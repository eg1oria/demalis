import "server-only";
import {
  type DisplayStatus,
  displayStatus,
  isAvailable,
  keyNight,
} from "@/lib/availability";
import type { IsoDate } from "@/lib/dates";
import type { AvailabilityStatus } from "@/lib/places/constants";
import type { Tables } from "@/lib/supabase/database.types";
import { createPublicClient } from "@/lib/supabase/public";
import { resolveWhen } from "@/lib/when";
import {
  AMENITY_FILTERS,
  type CatalogFilters,
  onlyFree,
  PRICE_RANGES,
} from "./filters";

/** Поля для карточки в списке и маркера на карте. */
export const CARD_FIELDS =
  "id, slug, name_ru, name_kk, type, direction, drive_minutes, price_from, price_unit, capacity_max, photos, photos_permission, has_banya, has_chan, has_pool, pets_allowed, has_kitchen, has_bbq, winter_ok, has_wifi, lat, lng" as const;

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
> & {
  /** Статус на выбранную ночь; нет — даты не выбраны. */
  status?: DisplayStatus;
};

/** Больше объектов в каталоге пока не ожидаем; при росте — перенести фильтр дат в SQL. */
const MAX_PLACES = 1000;

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
  let query = createPublicClient()
    .from("places")
    .select(CARD_FIELDS)
    .eq("status", "published");

  if (filters.drive) query = query.lte("drive_minutes", filters.drive);
  if (filters.guests) query = query.gte("capacity_max", filters.guests);
  if (filters.price) {
    const { min, max } = PRICE_RANGES[filters.price];
    if (min !== undefined) query = query.gte("price_from", min);
    if (max !== undefined) query = query.lte("price_from", max);
  }
  for (const amenity of filters.amenities)
    query = query.eq(AMENITY_FILTERS[amenity], true);
  if (filters.type) query = query.eq("type", filters.type);
  if (filters.dir) query = query.eq("direction", filters.dir);

  if (filters.sort === "price")
    query = query.order("price_from", { ascending: true, nullsFirst: false });
  else if (filters.sort === "near")
    query = query.order("drive_minutes", {
      ascending: true,
      nullsFirst: false,
    });
  // «Рекомендуемые»: пока новые сверху; продвижение добавится на Этапе 8.
  query = query.order("created_at", { ascending: false }).order("id");

  const { data, error } = await query.limit(MAX_PLACES);
  if (error) throw error;

  let all: PlaceCardData[] = data;
  let night: IsoDate | null = null;

  if (filters.when) {
    night = keyNight(resolveWhen(filters.when, now).nights);
    const statuses = await statusesForNight(night, now);
    all = all.map((place) => ({
      ...place,
      status: statuses.get(place.id) ?? "unknown",
    }));
    if (onlyFree(filters)) all = all.filter((p) => isAvailable(p.status!));
  }

  return { places: all.slice(0, filters.limit), all, total: all.length, night };
}

/** Статусы всех опубликованных объектов на одну ночь (RLS не отдаст черновики). */
export async function statusesForNight(
  night: IsoDate,
  now: Date,
): Promise<Map<string, DisplayStatus>> {
  const supabase = createPublicClient();
  const [rows, freshness] = await Promise.all([
    supabase.from("availability").select("place_id, status").eq("date", night),
    supabase
      .from("place_availability_updates")
      .select("place_id, last_updated_at"),
  ]);
  if (rows.error) throw rows.error;
  if (freshness.error) throw freshness.error;

  const lastUpdated = new Map(
    freshness.data.map((r) => [r.place_id, r.last_updated_at] as const),
  );
  const result = new Map<string, DisplayStatus>();
  for (const [placeId, updatedAt] of lastUpdated) {
    if (placeId) result.set(placeId, displayStatus(null, updatedAt, now));
  }
  for (const row of rows.data) {
    result.set(
      row.place_id,
      displayStatus(row.status, lastUpdated.get(row.place_id), now),
    );
  }
  return result;
}

export async function getPlaceBySlug(slug: string) {
  const { data, error } = await createPublicClient()
    .from("places")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw error;
  return data;
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
  const supabase = createPublicClient();
  const [rows, freshness] = await Promise.all([
    supabase
      .from("availability")
      .select("date, status")
      .eq("place_id", placeId)
      .gte("date", from)
      .lte("date", to),
    supabase
      .from("place_availability_updates")
      .select("last_updated_at")
      .eq("place_id", placeId)
      .maybeSingle(),
  ]);
  if (rows.error) throw rows.error;
  if (freshness.error) throw freshness.error;

  return {
    days: Object.fromEntries(rows.data.map((r) => [r.date, r.status])),
    lastUpdatedAt: freshness.data?.last_updated_at ?? null,
  };
}

/** Похожие: то же направление, потом тот же тип. */
export async function findSimilar(
  place: Pick<Tables<"places">, "id" | "direction" | "type">,
  limit = 4,
): Promise<PlaceCardData[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("places")
    .select(CARD_FIELDS)
    .eq("status", "published")
    .neq("id", place.id)
    .or(`direction.eq.${place.direction},type.eq.${place.type}`)
    .limit(12);
  if (error) throw error;
  return [...data]
    .sort(
      (a, b) =>
        Number(b.direction === place.direction) -
        Number(a.direction === place.direction),
    )
    .slice(0, limit);
}
