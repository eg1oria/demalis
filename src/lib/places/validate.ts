import { normalizeKzPhone } from "@/lib/phone";
import { isValidSlug, slugify } from "@/lib/slug";
import {
  AMENITIES,
  type Amenity,
  DIRECTIONS,
  type Direction,
  PLACE_STATUSES,
  PLACE_TYPES,
  type PlaceStatus,
  type PlaceType,
  type Plan,
  PLANS,
  PRICE_UNITS,
  type PriceUnit,
} from "./constants";

/** Сырые значения из формы или строки CSV. */
export type RawPlaceInput = Record<string, string | null | undefined>;

/** Поля объекта, которые вводит админ (без id, фото и служебных дат). */
export type PlaceInput = {
  slug: string;
  name_ru: string;
  name_kk: string | null;
  type: PlaceType;
  direction: Direction;
  address_text: string | null;
  lat: number | null;
  lng: number | null;
  drive_minutes: number | null;
  price_from: number | null;
  price_unit: PriceUnit;
  capacity_max: number | null;
  description_ru: string | null;
  description_kk: string | null;
  whatsapp_phone: string;
  instagram_url: string | null;
  video_url: string | null;
  status: PlaceStatus;
  plan: Plan;
  pro_until: string | null;
  featured_until: string | null;
  owner_id: string | null;
  photos_permission: boolean;
} & Record<Amenity, boolean>;

export type FieldError = { field: string; message: string };

export type ValidationResult =
  { ok: true; data: PlaceInput } | { ok: false; errors: FieldError[] };

export const FIELD_LABELS: Record<string, string> = {
  slug: "Адрес (slug)",
  name_ru: "Название (рус)",
  name_kk: "Название (каз)",
  type: "Тип",
  direction: "Направление",
  address_text: "Адрес",
  lat: "Широта",
  lng: "Долгота",
  drive_minutes: "Время в пути, мин",
  price_from: "Цена от, ₸",
  price_unit: "Цена за",
  capacity_max: "Гостей максимум",
  description_ru: "Описание (рус)",
  description_kk: "Описание (каз)",
  whatsapp_phone: "Телефон WhatsApp",
  instagram_url: "Instagram",
  video_url: "Видео",
  status: "Статус",
  plan: "Тариф",
  pro_until: "Pro до",
  featured_until: "Продвижение до",
  owner_id: "Владелец",
  photos_permission: "Разрешение на фото",
  ...AMENITIES,
};

const TRUE_VALUES = new Set(["1", "true", "yes", "да", "on", "+"]);
const FALSE_VALUES = new Set(["0", "false", "no", "нет", "off", "-", ""]);

/**
 * Проверяет и нормализует данные объекта.
 * Используется и формой в админке, и CSV-импортом, чтобы правила были одни.
 */
export function validatePlaceInput(raw: RawPlaceInput): ValidationResult {
  const errors: FieldError[] = [];
  const fail = (field: string, message: string) => {
    errors.push({
      field,
      message: `${FIELD_LABELS[field] ?? field}: ${message}`,
    });
    return null;
  };

  const text = (field: string): string | null => {
    const value = raw[field]?.trim();
    return value ? value : null;
  };

  const required = (field: string): string | null =>
    text(field) ?? fail(field, "обязательное поле");

  /** Принимает и ключ enum (`glamping`), и русскую подпись («Глэмпинг»). */
  const oneOf = <K extends string>(
    field: string,
    options: Record<K, string>,
    fallback?: K,
  ): K | null => {
    const value = text(field);
    if (!value) return fallback ?? fail(field, "обязательное поле");
    const lower = value.toLowerCase();
    const match = (Object.keys(options) as K[]).find(
      (key) => key === lower || options[key].toLowerCase() === lower,
    );
    return match ?? fail(field, `неизвестное значение «${value}»`);
  };

  const int = (field: string, min: number): number | null => {
    const value = text(field)?.replace(/\s/g, "");
    if (!value) return null;
    if (!/^\d+$/.test(value)) return fail(field, "нужно целое число");
    const n = Number(value);
    return n >= min ? n : fail(field, `должно быть не меньше ${min}`);
  };

  const coord = (field: string, limit: number): number | null => {
    const value = text(field)?.replace(",", ".");
    if (!value) return null;
    const n = Number(value);
    if (!Number.isFinite(n) || Math.abs(n) > limit)
      return fail(field, "неверная координата");
    return n;
  };

  const bool = (field: string): boolean => {
    const value = (raw[field] ?? "").trim().toLowerCase();
    if (TRUE_VALUES.has(value)) return true;
    if (!FALSE_VALUES.has(value))
      fail(field, `нужно да/нет (или 1/0), получено «${value}»`);
    return false;
  };

  const url = (field: string): string | null => {
    const value = text(field);
    if (!value) return null;
    try {
      const parsed = new URL(value);
      if (parsed.protocol === "https:" || parsed.protocol === "http:")
        return value;
    } catch {}
    return fail(field, "нужна ссылка, начинающаяся с https://");
  };

  const instagram = (): string | null => {
    const value = text("instagram_url");
    if (value && /^@[\w.]+$/.test(value))
      return `https://www.instagram.com/${value.slice(1)}/`;
    return url("instagram_url");
  };

  const date = (field: string): string | null => {
    const value = text(field);
    if (!value) return null;
    const valid =
      /^\d{4}-\d{2}-\d{2}$/.test(value) &&
      !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime());
    return valid ? value : fail(field, "нужна дата в формате ГГГГ-ММ-ДД");
  };

  const uuid = (field: string): string | null => {
    const value = text(field);
    if (!value) return null;
    return /^[0-9a-f-]{36}$/i.test(value) ? value : fail(field, "неверный id");
  };

  const name_ru = required("name_ru");

  let slug = text("slug")?.toLowerCase() ?? null;
  if (slug && !isValidSlug(slug)) {
    slug = fail("slug", "только латиница, цифры и дефисы");
  } else if (!slug && name_ru) {
    slug = slugify(name_ru) || fail("slug", "не удалось построить из названия");
  }

  const phoneRaw = required("whatsapp_phone");
  const whatsapp_phone = phoneRaw
    ? (normalizeKzPhone(phoneRaw) ??
      fail(
        "whatsapp_phone",
        `неверный номер «${phoneRaw}», нужен +77XXXXXXXXX`,
      ))
    : null;

  const amenities = Object.fromEntries(
    (Object.keys(AMENITIES) as Amenity[]).map((key) => [key, bool(key)]),
  ) as Record<Amenity, boolean>;

  const data = {
    slug,
    name_ru,
    name_kk: text("name_kk"),
    type: oneOf("type", PLACE_TYPES),
    direction: oneOf("direction", DIRECTIONS),
    address_text: text("address_text"),
    lat: coord("lat", 90),
    lng: coord("lng", 180),
    drive_minutes: int("drive_minutes", 0),
    price_from: int("price_from", 0),
    price_unit: oneOf("price_unit", PRICE_UNITS, "per_night_unit"),
    capacity_max: int("capacity_max", 1),
    description_ru: text("description_ru"),
    description_kk: text("description_kk"),
    whatsapp_phone,
    instagram_url: instagram(),
    video_url: url("video_url"),
    status: oneOf("status", PLACE_STATUSES, "draft"),
    plan: oneOf("plan", PLANS, "free"),
    pro_until: date("pro_until"),
    featured_until: date("featured_until"),
    owner_id: uuid("owner_id"),
    photos_permission: bool("photos_permission"),
    ...amenities,
  };

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, data: data as PlaceInput };
}
