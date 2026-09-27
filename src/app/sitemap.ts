import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
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
    supabase.from("collections").select("slug, updated_at"),
  ]);
  if (places.error) throw places.error;
  if (collections.error) throw collections.error;

  return [
    ...entries("", { changeFrequency: "daily", priority: 1 }),
    ...entries("/catalog", { changeFrequency: "daily", priority: 0.9 }),
    ...collections.data.flatMap((c) =>
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
  ];
}
