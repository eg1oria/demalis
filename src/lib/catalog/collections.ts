import "server-only";
import { type Collection, collectionFilters } from "@/lib/collections";
import { visiblePhotos } from "@/lib/places/present";
import { createPublicClient } from "@/lib/supabase/public";
import { findPlaces } from "./query";

/** Опубликованные подборки по порядку (RLS не отдаст скрытые). */
export async function listCollections(): Promise<Collection[]> {
  const { data, error } = await createPublicClient()
    .from("collections")
    .select("*")
    .order("sort_order")
    .order("title_ru");
  if (error) throw error;
  return data;
}

export async function getCollectionBySlug(
  slug: string,
): Promise<Collection | null> {
  const { data, error } = await createPublicClient()
    .from("collections")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Подборки с числом объектов и обложкой (первое фото из подборки) — для плиток. */
export async function collectionsWithCounts(limit?: number) {
  const collections = (await listCollections()).slice(0, limit);
  const results = await Promise.all(
    collections.map((c) => findPlaces(collectionFilters(c.filters))),
  );
  return collections.map((c, i) => {
    const cover = results[i].all
      .map((p) => visiblePhotos(p, 1)[0])
      .find(Boolean);
    return { ...c, count: results[i].total, cover };
  });
}
