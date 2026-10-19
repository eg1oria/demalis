import {
  DIRECTIONS,
  type Direction,
  PLACE_TYPES,
  type PlaceType,
} from "@/lib/places/constants";

/**
 * Фильтры каталога. Все хранятся в адресе (?chan=1&drive=60&guests=6),
 * чтобы ссылкой можно было поделиться.
 */

export const DRIVE_OPTIONS = [30, 60, 120] as const;
export type DriveOption = (typeof DRIVE_OPTIONS)[number];

export const PRICE_OPTIONS = ["30", "60", "100", "100plus"] as const;
export type PriceOption = (typeof PRICE_OPTIONS)[number];

/** Границы цены за ночь, ₸: «до 30 тыс.», «30–60», «60–100», «выше 100». */
export const PRICE_RANGES: Record<PriceOption, { min?: number; max?: number }> =
  {
    "30": { max: 30000 },
    "60": { min: 30001, max: 60000 },
    "100": { min: 60001, max: 100000 },
    "100plus": { min: 100001 },
  };

/** Ключ в адресе → поле в базе. */
export const AMENITY_FILTERS = {
  chan: "has_chan",
  banya: "has_banya",
  pool: "has_pool",
  pets: "pets_allowed",
  kitchen: "has_kitchen",
  winter: "winter_ok",
} as const;
export type AmenityFilter = keyof typeof AMENITY_FILTERS;

export const SORT_OPTIONS = ["recommended", "price", "near"] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

/** Даты: «эти выходные», «следующие», конкретная дата. Фильтруют с Этапа 3. */
export type WhenOption = "this" | "next" | `${number}-${number}-${number}`;

export const MAX_GUESTS = 30;
export const PAGE_SIZE = 12;

export type CatalogFilters = {
  when?: WhenOption;
  drive?: DriveOption;
  guests?: number;
  price?: PriceOption;
  amenities: AmenityFilter[];
  type?: PlaceType;
  dir?: Direction;
  sort: SortOption;
  /** Сколько карточек показать («Показать ещё» увеличивает). */
  limit: number;
  /** Показывать и занятые (по умолчанию при выбранных датах — только свободные). */
  all?: boolean;
  /** Режим «Карта» вместо списка. */
  view?: "map";
};

export const EMPTY_FILTERS: CatalogFilters = {
  amenities: [],
  sort: "recommended",
  limit: PAGE_SIZE,
};

type SearchParamsInput =
  URLSearchParams | Record<string, string | string[] | undefined>;

function getter(params: SearchParamsInput) {
  return (key: string): string | undefined => {
    if (params instanceof URLSearchParams) return params.get(key) ?? undefined;
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };
}

function oneOf<T extends string>(
  value: string | undefined,
  options: readonly T[],
): T | undefined {
  return options.find((o) => o === value);
}

/** Разбирает адрес. Мусорные значения молча игнорируются. */
export function parseFilters(params: SearchParamsInput): CatalogFilters {
  const get = getter(params);

  const when = get("when");
  const drive = Number(get("drive"));
  const guests = Number(get("guests"));
  const limit = Number(get("n"));
  const type = get("type");
  const dir = get("dir");

  return {
    when:
      when === "this" || when === "next" || isIsoDate(when)
        ? (when as WhenOption)
        : undefined,
    drive: DRIVE_OPTIONS.find((d) => d === drive),
    guests:
      Number.isInteger(guests) && guests >= 1 && guests <= MAX_GUESTS
        ? guests
        : undefined,
    price: oneOf(get("price"), PRICE_OPTIONS),
    amenities: (Object.keys(AMENITY_FILTERS) as AmenityFilter[]).filter(
      (key) => get(key) === "1",
    ),
    type: type && type in PLACE_TYPES ? (type as PlaceType) : undefined,
    dir: dir && dir in DIRECTIONS ? (dir as Direction) : undefined,
    sort: oneOf(get("sort"), SORT_OPTIONS) ?? "recommended",
    limit:
      Number.isInteger(limit) && limit > PAGE_SIZE && limit <= 240
        ? limit
        : PAGE_SIZE,
    all: get("all") === "1" || undefined,
    view: get("view") === "map" ? "map" : undefined,
  };
}

/** Собирает адрес. Значения по умолчанию не пишем, чтобы ссылки были короче. */
export function toSearchParams(filters: CatalogFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.when) params.set("when", filters.when);
  for (const key of filters.amenities) params.set(key, "1");
  if (filters.drive) params.set("drive", String(filters.drive));
  if (filters.guests) params.set("guests", String(filters.guests));
  if (filters.price) params.set("price", filters.price);
  if (filters.type) params.set("type", filters.type);
  if (filters.dir) params.set("dir", filters.dir);
  if (filters.sort !== "recommended") params.set("sort", filters.sort);
  if (filters.limit !== PAGE_SIZE) params.set("n", String(filters.limit));
  if (filters.all) params.set("all", "1");
  if (filters.view) params.set("view", filters.view);
  return params;
}

export function catalogHref(filters: Partial<CatalogFilters>): string {
  const query = toSearchParams({ ...EMPTY_FILTERS, ...filters }).toString();
  return query ? `/catalog?${query}` : "/catalog";
}

/** «Только свободные» включён по умолчанию, когда выбраны даты. */
export function onlyFree(filters: CatalogFilters): boolean {
  return Boolean(filters.when) && !filters.all;
}

/** Сколько фильтров включено (для счётчика на кнопке «Все фильтры»). */
export function countActiveFilters(filters: CatalogFilters): number {
  return (
    filters.amenities.length +
    [
      filters.drive,
      filters.guests,
      filters.price,
      filters.type,
      filters.dir,
    ].filter(Boolean).length
  );
}

export function toggleAmenity(
  filters: CatalogFilters,
  amenity: AmenityFilter,
): CatalogFilters {
  const amenities = filters.amenities.includes(amenity)
    ? filters.amenities.filter((a) => a !== amenity)
    : [...filters.amenities, amenity];
  return { ...filters, amenities, limit: PAGE_SIZE };
}

function isIsoDate(value: string | undefined): boolean {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime());
}
