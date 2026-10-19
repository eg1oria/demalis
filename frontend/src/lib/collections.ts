import {
  type CatalogFilters,
  PAGE_SIZE,
  parseFilters,
  toSearchParams,
  type WhenOption,
} from "@/lib/catalog/filters";
import type { Tables } from "@/lib/api/types";
import { almatyToday, toIsoDate } from "@/lib/dates";

export type Collection = Tables<"collections">;

/**
 * Фильтры подборки в каноничном виде («chan=1&drive=60»).
 * Даты, «Показать ещё», режим карты в подборке не храним: страница
 * подборки постоянная, а даты посетитель выберет сам в каталоге.
 */
export function normalizeCollectionFilters(raw: string): string {
  const query = raw.trim().replace(/^.*\?/, "");
  return toSearchParams(collectionFilters(query)).toString();
}

export function collectionFilters(filters: string): CatalogFilters {
  const parsed = parseFilters(new URLSearchParams(filters));
  return {
    ...parsed,
    when: undefined,
    all: undefined,
    view: undefined,
    limit: PAGE_SIZE,
  };
}

export function collectionTitle(
  c: Pick<Collection, "title_ru" | "title_kk">,
  locale: string,
): string {
  return (locale === "kk" && c.title_kk?.trim()) || c.title_ru;
}

export function collectionIntro(
  c: Pick<Collection, "intro_ru" | "intro_kk">,
  locale: string,
): string | null {
  return (locale === "kk" && c.intro_kk?.trim()) || c.intro_ru?.trim() || null;
}

/**
 * Ночь праздничной подборки, пока она не прошла (по Алматы). После неё
 * подборка показывается как обычная.
 */
export function collectionNight(
  c: Pick<Collection, "night">,
  now: Date,
): WhenOption | null {
  return c.night && c.night >= toIsoDate(almatyToday(now))
    ? (c.night as WhenOption)
    : null;
}
