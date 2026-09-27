import type { Tables } from "@/lib/supabase/database.types";
import type { Amenity } from "./constants";

type Localizable = Pick<Tables<"places">, "name_ru" | "name_kk">;

/** Казахское название, если заполнено, иначе русское. */
export function placeName(place: Localizable, locale: string): string {
  return (locale === "kk" && place.name_kk?.trim()) || place.name_ru;
}

export function placeDescription(
  place: Pick<Tables<"places">, "description_ru" | "description_kk">,
  locale: string,
): string | null {
  return (
    (locale === "kk" && place.description_kk?.trim()) ||
    place.description_ru?.trim() ||
    null
  );
}

/**
 * Без разрешения владельца фото не показываем.
 * limit — сколько фото даёт тариф (free — 5, Pro — 20).
 */
export function visiblePhotos(
  place: Pick<Tables<"places">, "photos" | "photos_permission">,
  limit?: number,
): string[] {
  return place.photos_permission ? place.photos.slice(0, limit) : [];
}

/** Порядок важности удобств — для «3 главных» на карточке. */
export const AMENITY_PRIORITY: Amenity[] = [
  "has_chan",
  "has_banya",
  "has_pool",
  "pets_allowed",
  "has_bbq",
  "has_kitchen",
  "winter_ok",
  "has_wifi",
];

export function placeAmenities(
  place: Record<Amenity, boolean>,
  limit = AMENITY_PRIORITY.length,
): Amenity[] {
  return AMENITY_PRIORITY.filter((a) => place[a]).slice(0, limit);
}

/** Ссылка wa.me с готовым текстом (номер без «+»). */
export function whatsappUrl(phone: string, text: string): string {
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}

/** Стабильный вариант заглушки-пейзажа для объекта без фото. */
export function landscapeVariant(id: string, variants: number): number {
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return hash % variants;
}
