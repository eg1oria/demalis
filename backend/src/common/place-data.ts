import type { Prisma } from '../generated/prisma/client';
import { dbDateOrNull } from '../prisma/dates';
import type { PlaceInput } from '../shared/places/validate';

/** Проверенные поля объекта → данные для Prisma (даты — в Date). */
export function placeData(
  input: PlaceInput,
): Omit<Prisma.PlaceUncheckedCreateInput, 'id'> {
  return {
    ...input,
    pro_until: dbDateOrNull(input.pro_until),
    featured_until: dbDateOrNull(input.featured_until),
  };
}

/** Поля для карточки в списке и маркера на карте. */
export const CARD_SELECT = {
  id: true,
  slug: true,
  name_ru: true,
  name_kk: true,
  type: true,
  direction: true,
  drive_minutes: true,
  price_from: true,
  price_unit: true,
  capacity_max: true,
  photos: true,
  photos_permission: true,
  has_banya: true,
  has_chan: true,
  has_pool: true,
  pets_allowed: true,
  has_kitchen: true,
  has_bbq: true,
  winter_ok: true,
  has_wifi: true,
  lat: true,
  lng: true,
  plan: true,
  pro_until: true,
  featured_until: true,
} as const satisfies Prisma.PlaceSelect;
