import type { Metadata } from "next";
import { SITE_NAME } from "@/config/site";
import { routing } from "@/i18n/routing";

/**
 * Адрес сайта для канонических ссылок, sitemap и Open Graph.
 * На Vercel без NEXT_PUBLIC_SITE_URL берём основной домен проекта.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000")
).replace(/\/$/, "");

export const absoluteUrl = (path: string) => `${SITE_URL}${path}`;

const OG_LOCALE: Record<string, string> = { ru: "ru_RU", kk: "kk_KZ" };

/** /ru/… и /kk/… друг для друга (hreflang); x-default — русская версия. */
export function languageAlternates(path: string): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of routing.locales) languages[locale] = `/${locale}${path}`;
  languages["x-default"] = `/${routing.defaultLocale}${path}`;
  return languages;
}

/**
 * Метаданные страницы сайта: title, description, canonical, hreflang и Open Graph.
 * path — адрес без языка («/catalog», «/place/slug», «» для главной).
 */
export function pageMetadata({
  locale,
  path,
  title,
  description,
  images = [],
  absoluteTitle = false,
}: {
  locale: string;
  path: string;
  title: string;
  description?: string | null;
  images?: string[];
  absoluteTitle?: boolean;
}): Metadata {
  const desc = description ? truncate(description, 160) : undefined;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description: desc,
    alternates: {
      canonical: `/${locale}${path}`,
      languages: languageAlternates(path),
    },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: OG_LOCALE[locale] ?? OG_LOCALE.ru,
      url: `/${locale}${path}`,
      title: absoluteTitle ? title : `${title} — ${SITE_NAME}`,
      description: desc,
      images: images.slice(0, 4),
    },
  };
}

/** Обрезает по слову и ставит «…», если текст длиннее max. */
export function truncate(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,.;:—–-]+$/, "")}…`;
}

// ── JSON-LD ─────────────────────────────────────────────────────────────

/** JSON для <script type="application/ld+json">: «<» экранируем от XSS. */
export function jsonLdString(data: object): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function lodgingJsonLd(place: {
  name: string;
  description: string | null;
  url: string;
  images: string[];
  address: string | null;
  locality: string | null;
  region: string;
  lat: number | null;
  lng: number | null;
  phone: string;
  priceRange: string | null;
  amenities: string[];
  petsAllowed: boolean;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    name: place.name,
    ...(place.description && { description: place.description }),
    url: place.url,
    ...(place.images.length > 0 && { image: place.images }),
    address: {
      "@type": "PostalAddress",
      ...(place.address && { streetAddress: place.address }),
      ...(place.locality && { addressLocality: place.locality }),
      addressRegion: place.region,
      addressCountry: "KZ",
    },
    ...(place.lat != null &&
      place.lng != null && {
        geo: {
          "@type": "GeoCoordinates",
          latitude: place.lat,
          longitude: place.lng,
        },
      }),
    telephone: place.phone,
    ...(place.priceRange && { priceRange: place.priceRange }),
    currenciesAccepted: "KZT",
    ...(place.amenities.length > 0 && {
      amenityFeature: place.amenities.map((name) => ({
        "@type": "LocationFeatureSpecification",
        name,
        value: true,
      })),
    }),
    petsAllowed: place.petsAllowed,
  };
}
