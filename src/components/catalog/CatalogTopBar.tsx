"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { chipClass } from "@/components/site/Chip";
import {
  CalendarIcon,
  ChevronLeftIcon,
  FiltersIcon,
} from "@/components/site/Icons";
import { Link } from "@/i18n/navigation";
import {
  type AmenityFilter,
  type CatalogFilters,
  countActiveFilters,
  PAGE_SIZE,
  toggleAmenity,
} from "@/lib/catalog/filters";
import { FiltersSheet } from "./FiltersSheet";
import { useCatalogNavigation } from "./useCatalogNavigation";

type Chip =
  | { key: string; label: string; amenity: AmenityFilter }
  | { key: string; label: string; drive: 60 };

/** Верхняя панель каталога: сводка фильтров, кнопка «Все фильтры», чипсы. */
export function CatalogTopBar({
  filters,
  whenLabel,
}: {
  filters: CatalogFilters;
  whenLabel: string | null;
}) {
  const t = useTranslations("Catalog");
  const tChips = useTranslations("Chips");
  const tf = useTranslations("Format");
  const tDir = useTranslations("Directions");
  const tAmenities = useTranslations("Amenities");
  const { apply, pending } = useCatalogNavigation();
  const [sheetOpen, setSheetOpen] = useState(false);
  const active = countActiveFilters(filters);

  const chips: Chip[] = [
    { key: "chan", label: tChips("chan"), amenity: "chan" },
    { key: "drive60", label: tChips("drive60"), drive: 60 },
    { key: "banya", label: tAmenities("has_banya"), amenity: "banya" },
    { key: "pets", label: tChips("pets"), amenity: "pets" },
    { key: "pool", label: tAmenities("has_pool"), amenity: "pool" },
    { key: "winter", label: tChips("winter"), amenity: "winter" },
  ];

  const summary = [
    filters.guests ? tf("guests", { n: filters.guests }) : t("anyGuests"),
    filters.dir ? tDir(filters.dir) : t("anyDirection"),
  ].join(" · ");

  return (
    <div className="border-b border-line-soft bg-bg" aria-busy={pending}>
      <div className="mx-auto flex max-w-[1440px] items-center gap-2 px-3 pt-2.5 pb-2 md:px-20 md:pt-4">
        <Link
          href="/"
          aria-label={t("back")}
          className="flex size-11 flex-none items-center justify-center rounded-full md:hidden"
        >
          <ChevronLeftIcon size={22} />
        </Link>
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="flex h-13.5 min-w-0 flex-1 items-center gap-2.5 rounded-2xl border border-line bg-surface px-3.5 text-left md:max-w-md"
        >
          <CalendarIcon className="flex-none text-text-secondary" />
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-semibold">
              {whenLabel ?? t("anyDates")}
            </span>
            <span className="truncate text-xs text-text-muted">{summary}</span>
          </span>
        </button>
        <button
          type="button"
          aria-label={t("allFilters")}
          onClick={() => setSheetOpen(true)}
          className="relative flex size-13.5 flex-none items-center justify-center rounded-2xl border border-line bg-surface"
        >
          <FiltersIcon size={22} />
          {active > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-bold text-white">
              {active}
            </span>
          )}
        </button>
      </div>

      <div className="no-scrollbar mx-auto flex max-w-[1440px] gap-2 overflow-x-auto px-3 pt-0.5 pb-3 md:px-20">
        {chips.map((chip) => {
          const on =
            "amenity" in chip
              ? filters.amenities.includes(chip.amenity)
              : filters.drive === chip.drive;
          return (
            <button
              key={chip.key}
              type="button"
              aria-pressed={on}
              className={chipClass(on)}
              onClick={() =>
                apply(
                  "amenity" in chip
                    ? toggleAmenity(filters, chip.amenity)
                    : {
                        ...filters,
                        drive: on ? undefined : chip.drive,
                        limit: PAGE_SIZE,
                      },
                )
              }
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      {sheetOpen && (
        <FiltersSheet
          filters={filters}
          onClose={() => setSheetOpen(false)}
          onApply={(next) => {
            setSheetOpen(false);
            apply(next);
          }}
        />
      )}
    </div>
  );
}
