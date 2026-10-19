import "server-only";
import { type Collection, collectionFilters } from "@/lib/collections";
import { visiblePhotos } from "@/lib/places/present";
import { api, apiOrNull } from "@/lib/api/client";
import { findPlaces } from "./query";

/** Опубликованные подборки по порядку. */
export function listCollections(): Promise<Collection[]> {
  return api<Collection[]>("/public/collections");
}

export function getCollectionBySlug(slug: string): Promise<Collection | null> {
  return apiOrNull<Collection>(
    `/public/collections/${encodeURIComponent(slug)}`,
  );
}

/**
 * Подборки с числом объектов и обложкой (первое фото из подборки) — для плиток
 * и sitemap. Пустые подборки не показываем: «Пока пусто» выглядит как
 * недоделанный сайт (в том числе для проверки рекламы Google).
 */
export async function collectionsWithCounts(limit?: number) {
  const collections = await listCollections();
  const results = await Promise.all(
    collections.map((c) => findPlaces(collectionFilters(c.filters))),
  );
  return collections
    .map((c, i) => {
      const cover = results[i].all
        .map((p) => visiblePhotos(p, 1)[0])
        .find(Boolean);
      return { ...c, count: results[i].total, cover };
    })
    .filter((c) => c.count > 0)
    .slice(0, limit);
}
