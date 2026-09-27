"use client";

import { useTranslations } from "next-intl";
import { ChevronDownIcon } from "@/components/site/Icons";
import {
  type CatalogFilters,
  PAGE_SIZE,
  SORT_OPTIONS,
  type SortOption,
} from "@/lib/catalog/filters";
import { useCatalogNavigation } from "./useCatalogNavigation";

export function SortSelect({ filters }: { filters: CatalogFilters }) {
  const t = useTranslations("Catalog");
  const { apply } = useCatalogNavigation();

  return (
    <label className="relative flex h-11 items-center gap-1 px-2 text-sm text-text-secondary">
      <span className="sr-only">{t("sort")}</span>
      <select
        value={filters.sort}
        onChange={(e) =>
          apply({
            ...filters,
            sort: e.target.value as SortOption,
            limit: PAGE_SIZE,
          })
        }
        className="cursor-pointer appearance-none bg-transparent pr-5 outline-none"
      >
        {SORT_OPTIONS.map((sort) => (
          <option key={sort} value={sort}>
            {t(`sort_${sort}`)}
          </option>
        ))}
      </select>
      <ChevronDownIcon
        size={16}
        className="pointer-events-none absolute right-2"
      />
    </label>
  );
}
