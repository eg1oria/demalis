"use client";

import { useLocale, useTranslations } from "next-intl";
import { type ReactNode, useEffect, useState } from "react";
import { chipClass } from "@/components/site/Chip";
import { GuestStepper } from "@/components/site/GuestStepper";
import { CloseIcon } from "@/components/site/Icons";
import {
  AMENITY_FILTERS,
  type AmenityFilter,
  type CatalogFilters,
  DRIVE_OPTIONS,
  EMPTY_FILTERS,
  MAX_GUESTS,
  PAGE_SIZE,
  PRICE_OPTIONS,
  SORT_OPTIONS,
  toggleAmenity,
  type WhenOption,
} from "@/lib/catalog/filters";
import { almatyToday, toIsoDate } from "@/lib/dates";
import { DIRECTIONS, PLACE_TYPES } from "@/lib/places/constants";

/** Все фильтры каталога. Изменения применяются кнопкой «Показать варианты». */
export function FiltersSheet({
  filters,
  onClose,
  onApply,
}: {
  filters: CatalogFilters;
  onClose: () => void;
  onApply: (filters: CatalogFilters) => void;
}) {
  const t = useTranslations("Catalog");
  const tf = useTranslations("Format");
  const tTypes = useTranslations("Types");
  const tDir = useTranslations("Directions");
  const tAmenities = useTranslations("Amenities");
  const [draft, setDraft] = useState<CatalogFilters>(filters);
  const set = (patch: Partial<CatalogFilters>) =>
    setDraft((d) => ({ ...d, ...patch }));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  const guests = draft.guests ?? 1;
  const locale = useLocale();
  const today = toIsoDate(almatyToday(new Date()));
  const customDate =
    draft.when && draft.when !== "this" && draft.when !== "next"
      ? draft.when
      : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-text/40 md:items-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="filters-title"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92dvh] w-full flex-col rounded-t-3xl bg-bg shadow-float md:max-w-xl md:rounded-3xl"
      >
        <div className="flex items-center justify-between border-b border-line-soft px-5 py-2">
          <h2 id="filters-title" className="font-serif text-xl font-medium">
            {t("filtersTitle")}
          </h2>
          <button
            type="button"
            aria-label={t("close")}
            onClick={onClose}
            className="flex size-11 items-center justify-center rounded-full"
          >
            <CloseIcon size={22} />
          </button>
        </div>

        <div className="flex flex-col gap-6 overflow-y-auto px-5 py-5">
          <Group title={t("when")}>
            <Choice
              selected={!draft.when}
              onClick={() => set({ when: undefined })}
            >
              {t("when_any")}
            </Choice>
            <Choice
              selected={draft.when === "this"}
              onClick={() => set({ when: "this" })}
            >
              {t("when_this")}
            </Choice>
            <Choice
              selected={draft.when === "next"}
              onClick={() => set({ when: "next" })}
            >
              {t("when_next")}
            </Choice>
            <label
              className={`relative cursor-pointer ${chipClass(customDate !== null)}`}
            >
              {customDate
                ? new Date(`${customDate}T00:00:00Z`).toLocaleDateString(
                    locale,
                    {
                      day: "numeric",
                      month: "short",
                      timeZone: "UTC",
                    },
                  )
                : t("when_date")}
              <input
                type="date"
                min={today}
                value={customDate ?? ""}
                aria-label={t("when_date")}
                onClick={(e) => e.currentTarget.showPicker?.()}
                onChange={(e) =>
                  e.target.value && set({ when: e.target.value as WhenOption })
                }
                className="absolute inset-0 cursor-pointer opacity-0"
              />
            </label>
          </Group>

          <Group title={t("drive")}>
            <Choice
              selected={!draft.drive}
              onClick={() => set({ drive: undefined })}
            >
              {t("drive_any")}
            </Choice>
            {DRIVE_OPTIONS.map((d) => (
              <Choice
                key={d}
                selected={draft.drive === d}
                onClick={() => set({ drive: d })}
              >
                {t(`drive_${d}`)}
              </Choice>
            ))}
          </Group>

          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-text-muted">
              {t("guests")}
            </h3>
            <GuestStepper
              value={guests}
              min={1}
              max={MAX_GUESTS}
              onChange={(n) => set({ guests: n > 1 ? n : undefined })}
              label={t("guests")}
              valueLabel={
                draft.guests ? tf("guests", { n: guests }) : t("anyGuests")
              }
              decreaseLabel="−"
              increaseLabel="+"
            />
          </div>

          <Group title={t("price")}>
            <Choice
              selected={!draft.price}
              onClick={() => set({ price: undefined })}
            >
              {t("price_any")}
            </Choice>
            {PRICE_OPTIONS.map((p) => (
              <Choice
                key={p}
                selected={draft.price === p}
                onClick={() => set({ price: p })}
              >
                {t(`price_${p}`)}
              </Choice>
            ))}
          </Group>

          <Group title={t("amenities")}>
            {(
              Object.entries(AMENITY_FILTERS) as [
                AmenityFilter,
                (typeof AMENITY_FILTERS)[AmenityFilter],
              ][]
            ).map(([key, field]) => (
              <Choice
                key={key}
                selected={draft.amenities.includes(key)}
                onClick={() => setDraft((d) => toggleAmenity(d, key))}
              >
                {tAmenities(field)}
              </Choice>
            ))}
          </Group>

          <Group title={t("type")}>
            <Choice
              selected={!draft.type}
              onClick={() => set({ type: undefined })}
            >
              {t("type_any")}
            </Choice>
            {(Object.keys(PLACE_TYPES) as (keyof typeof PLACE_TYPES)[]).map(
              (type) => (
                <Choice
                  key={type}
                  selected={draft.type === type}
                  onClick={() => set({ type })}
                >
                  {tTypes(type)}
                </Choice>
              ),
            )}
          </Group>

          <Group title={t("direction")}>
            <Choice
              selected={!draft.dir}
              onClick={() => set({ dir: undefined })}
            >
              {t("direction_any")}
            </Choice>
            {(Object.keys(DIRECTIONS) as (keyof typeof DIRECTIONS)[]).map(
              (dir) => (
                <Choice
                  key={dir}
                  selected={draft.dir === dir}
                  onClick={() => set({ dir })}
                >
                  {tDir(dir)}
                </Choice>
              ),
            )}
          </Group>

          <Group title={t("sort")}>
            {SORT_OPTIONS.map((sort) => (
              <Choice
                key={sort}
                selected={draft.sort === sort}
                onClick={() => set({ sort })}
              >
                {t(`sort_${sort}`)}
              </Choice>
            ))}
          </Group>
        </div>

        <div className="flex gap-2.5 border-t border-line-soft bg-surface px-5 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] md:rounded-b-3xl">
          <button
            type="button"
            onClick={() => setDraft({ ...EMPTY_FILTERS, when: draft.when })}
            className="h-13 flex-none rounded-2xl border border-line-strong px-5 font-semibold"
          >
            {t("clear")}
          </button>
          <button
            type="button"
            onClick={() => onApply({ ...draft, limit: PAGE_SIZE })}
            className="h-13 flex-1 rounded-2xl bg-accent font-semibold text-white"
          >
            {t("apply")}
          </button>
        </div>
      </div>
    </div>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-semibold text-text-muted">
        {title}
      </legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

function Choice({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={chipClass(selected)}
    >
      {children}
    </button>
  );
}
