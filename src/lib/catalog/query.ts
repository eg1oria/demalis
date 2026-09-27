import "server-only";
import type { Tables } from "@/lib/supabase/database.types";
import { createPublicClient } from "@/lib/supabase/public";
import { AMENITY_FILTERS, type CatalogFilters, PRICE_RANGES } from "./filters";

/** Поля для карточки в списке. */
export const CARD_FIELDS =
  "id, slug, name_ru, name_kk, type, direction, drive_minutes, price_from, price_unit, capacity_max, photos, photos_permission, has_banya, has_chan, has_pool, pets_allowed, has_kitchen, has_bbq, winter_ok, has_wifi" as const;

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
>;

/** Каталог: все фильтры, кроме дат (даты — Этап 3). */
export async function findPlaces(
  filters: CatalogFilters,
): Promise<{ places: PlaceCardData[]; total: number }> {
  let query = createPublicClient()
    .from("places")
    .select(CARD_FIELDS, { count: "exact" })
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

  const { data, count, error } = await query.range(0, filters.limit - 1);
  if (error) throw error;
  return { places: data, total: count ?? 0 };
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

export async function countPublished(): Promise<number> {
  const { count, error } = await createPublicClient()
    .from("places")
    .select("id", { count: "exact", head: true })
    .eq("status", "published");
  if (error) throw error;
  return count ?? 0;
}
