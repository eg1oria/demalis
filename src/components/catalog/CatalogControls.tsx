"use client";

import { useTranslations } from "next-intl";
import {
  type CatalogFilters,
  onlyFree,
  PAGE_SIZE,
} from "@/lib/catalog/filters";
import { useCatalogNavigation } from "./useCatalogNavigation";

const MapIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M9 4L3.5 6v14L9 18l6 2 5.5-2V4L15 6 9 4z" />
    <path d="M9 4v14M15 6v14" />
  </svg>
);
const ListIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

/** Переключатель «Список / Карта» (фон surface-muted, выбранный — белый). */
export function ViewToggle({ filters }: { filters: CatalogFilters }) {
  const t = useTranslations("Catalog");
  const { apply } = useCatalogNavigation();
  const options = [
    { view: undefined, label: t("list"), icon: <ListIcon /> },
    { view: "map" as const, label: t("map"), icon: <MapIcon /> },
  ];

  return (
    <div
      role="group"
      aria-label={t("view")}
      className="flex flex-none rounded-full bg-surface-muted p-[3px]"
    >
      {options.map((o) => {
        const selected = filters.view === o.view;
        return (
          <button
            key={o.label}
            type="button"
            aria-pressed={selected}
            onClick={() =>
              !selected && apply({ ...filters, view: o.view, limit: PAGE_SIZE })
            }
            className={`flex h-11 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold ${
              selected ? "bg-surface text-text" : "text-text-secondary"
            }`}
          >
            {o.icon}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** «Только свободные»: включён — трек accent, выключен — #CFCBC1 (design/README, п. 7). */
export function OnlyFreeToggle({ filters }: { filters: CatalogFilters }) {
  const t = useTranslations("Catalog");
  const { apply } = useCatalogNavigation();
  const on = onlyFree(filters);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() =>
        apply({ ...filters, all: on ? true : undefined, limit: PAGE_SIZE })
      }
      className="flex h-11 items-center gap-2.5 text-left text-sm font-medium whitespace-nowrap"
    >
      <span
        className={`relative block h-6.5 w-11 rounded-full ${on ? "bg-accent" : "bg-toggle-off"}`}
      >
        <span
          className={`absolute top-[3px] size-5 rounded-full bg-white transition-[left] ${on ? "left-[21px]" : "left-[3px]"}`}
        />
      </span>
      {t("onlyFree")}
    </button>
  );
}
