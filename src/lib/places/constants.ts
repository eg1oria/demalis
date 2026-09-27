// Значения enum из базы (supabase/migrations) и подписи для админки.

export const PLACE_TYPES = {
  glamping: "Глэмпинг",
  aframe: "A-frame",
  house: "Дом",
  zona_otdyha: "Зона отдыха",
  banya_complex: "Банный комплекс",
  guesthouse: "Гостевой дом",
} as const;

export const DIRECTIONS = {
  gory_almaty: "Горы Алматы",
  talgar: "Талгар",
  issyk_turgen: "Иссык / Тургень",
  kaskelen: "Каскелен",
  kapshagay: "Капшагай",
  charyn_kolsai: "Чарын / Кольсай",
  drugoe: "Другое",
} as const;

export const PRICE_UNITS = {
  per_night_unit: "за домик/номер за ночь",
  per_person: "за человека",
} as const;

export const PLACE_STATUSES = {
  draft: "Черновик",
  published: "Опубликован",
  hidden: "Скрыт",
} as const;

export const PLANS = {
  free: "Free",
  pro: "Pro",
} as const;

export const AVAILABILITY_STATUSES = {
  free: "Свободно",
  limited: "Мало мест",
  full: "Занято",
} as const;

export const AMENITIES = {
  has_banya: "Баня",
  has_chan: "Чан",
  has_pool: "Бассейн",
  pets_allowed: "Можно с животными",
  has_kitchen: "Кухня",
  has_bbq: "Мангал",
  winter_ok: "Зимой",
  has_wifi: "Wi-Fi",
} as const;

export type PlaceType = keyof typeof PLACE_TYPES;
export type Direction = keyof typeof DIRECTIONS;
export type PriceUnit = keyof typeof PRICE_UNITS;
export type PlaceStatus = keyof typeof PLACE_STATUSES;
export type Plan = keyof typeof PLANS;
export type AvailabilityStatus = keyof typeof AVAILABILITY_STATUSES;
export type Amenity = keyof typeof AMENITIES;

export const PHOTOS_BUCKET = "place-photos";

/** Сколько дней вперёд админ редактирует занятость. */
export const AVAILABILITY_DAYS = 60;
