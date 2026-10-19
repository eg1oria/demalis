import { type Locale, routing } from "@/i18n/routing";
import { MAX_GUESTS } from "@/lib/catalog/filters";
import type { IsoDate } from "@/lib/dates";

/**
 * Ссылки через /api/go/...: маршрут записывает клик и перенаправляет
 * в WhatsApp / Instagram (раздел 6 ТЗ). Звонок — обычная ссылка tel:,
 * клик по ней отправляется фоном (POST на тот же адрес).
 */
export const GO_KINDS = ["whatsapp", "phone", "instagram"] as const;
export type GoKind = (typeof GO_KINDS)[number];

export type GoOptions = {
  dates?: { checkIn: IsoDate; checkOut: IsoDate } | null;
  guests?: number | null;
  locale?: string;
};

export function goHref(
  kind: GoKind,
  placeId: string,
  { dates, guests, locale }: GoOptions = {},
): string {
  const params = new URLSearchParams();
  if (dates) params.set("dates", `${dates.checkIn}_${dates.checkOut}`);
  if (guests) params.set("guests", String(guests));
  if (locale && locale !== routing.defaultLocale) params.set("lang", locale);
  const query = params.toString();
  return `/api/go/${kind}/${placeId}${query ? `?${query}` : ""}`;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const isIsoDate = (v: string) =>
  ISO_DATE.test(v) && new Date(`${v}T00:00:00Z`).toISOString().startsWith(v);

/** Разбирает параметры ссылки. Мусор молча игнорируется. */
export function parseGoParams(
  params: URLSearchParams,
): Required<GoOptions> & { locale: Locale } {
  const [checkIn = "", checkOut = ""] = (params.get("dates") ?? "").split("_");
  const dates =
    isIsoDate(checkIn) && isIsoDate(checkOut) && checkOut > checkIn
      ? { checkIn, checkOut }
      : null;
  const guests = Number(params.get("guests"));
  const lang = params.get("lang");
  return {
    dates,
    guests:
      Number.isInteger(guests) && guests >= 1 && guests <= MAX_GUESTS
        ? guests
        : null,
    locale: routing.locales.find((l) => l === lang) ?? routing.defaultLocale,
  };
}
