import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { collectionsWithCounts } from "@/lib/catalog/collections";
import { absoluteUrl, languageAlternates } from "@/lib/seo";
import { createPublicClient } from "@/lib/supabase/public";

// Новые объекты и подборки попадают в sitemap в течение часа.
export const revalidate = 3600;

/** Каждая страница — на обоих языках, с взаимными hreflang. */
function entries(
  path: string,
  extra: Omit<MetadataRoute.Sitemap[number], "url"> = {},
): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(
    Object.entries(languageAlternates(path)).map(([lang, url]) => [
      lang,
      absoluteUrl(url),
    ]),
  );
  return routing.locales.map((locale) => ({
    url: absoluteUrl(`/${locale}${path}`),
    alternates: { languages },
    ...extra,
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createPublicClient();
  const [places, collections] = await Promise.all([
    supabase
      .from("places")
      .select("slug, updated_at")
      .eq("status", "published"),
    collectionsWithCounts(),
  ]);
  if (places.error) throw places.error;

  return [
    ...entries("", { changeFrequency: "daily", priority: 1 }),
    ...entries("/catalog", { changeFrequency: "daily", priority: 0.9 }),
    ...entries("/collections", { changeFrequency: "weekly", priority: 0.6 }),
    ...collections.flatMap((c) =>
      entries(`/collections/${c.slug}`, {
        lastModified: c.updated_at,
        changeFrequency: "daily",
        priority: 0.8,
      }),
    ),
    ...places.data.flatMap((p) =>
      entries(`/place/${p.slug}`, {
        lastModified: p.updated_at,
        changeFrequency: "daily",
        priority: 0.7,
      }),
    ),
    ...entries("/owners", { changeFrequency: "monthly", priority: 0.4 }),
    ...entries("/about", { changeFrequency: "monthly", priority: 0.3 }),
    ...entries("/contacts", { changeFrequency: "monthly", priority: 0.3 }),
    ...entries("/verified", { changeFrequency: "yearly", priority: 0.2 }),
    ...entries("/terms", { changeFrequency: "yearly", priority: 0.1 }),
    ...entries("/offer", { changeFrequency: "yearly", priority: 0.1 }),
    ...entries("/privacy", { changeFrequency: "yearly", priority: 0.1 }),
  ];
}
