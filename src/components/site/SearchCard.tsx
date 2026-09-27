"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import {
  catalogHref,
  MAX_GUESTS,
  type WhenOption,
} from "@/lib/catalog/filters";
import { GuestStepper } from "./GuestStepper";
import { SearchIcon } from "./Icons";
import { SegmentedControl } from "./SegmentedControl";

/** Поиск на главной: когда + сколько гостей → каталог. */
export function SearchCard({
  thisLabel,
  nextLabel,
  initialGuests,
  initialCount,
  today,
}: {
  thisLabel: string;
  nextLabel: string;
  initialGuests: number;
  initialCount: number;
  today: string;
}) {
  const t = useTranslations("HomePage");
  const tf = useTranslations("Format");
  const locale = useLocale();
  const [when, setWhen] = useState<WhenOption>("this");
  const [guests, setGuests] = useState(initialGuests);
  // Кэш «даты + гости → сколько вариантов», чтобы не спрашивать сервер повторно.
  const key = `${when}|${guests}`;
  const [counts, setCounts] = useState<Record<string, number>>({
    [`this|${initialGuests}`]: initialCount,
  });
  const [lastCount, setLastCount] = useState(initialCount);
  const count = counts[key] ?? lastCount;

  useEffect(() => {
    if (counts[key] !== undefined) return;
    const controller = new AbortController();
    const query = new URLSearchParams({ when, guests: String(guests) });
    fetch(`/api/catalog/count?${query}`, { signal: controller.signal })
      .then((r) => r.json())
      .then(({ count: next }: { count: number }) => {
        setCounts((c) => ({ ...c, [key]: next }));
        setLastCount(next);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [key, counts, when, guests]);

  const customDate = when !== "this" && when !== "next" ? when : null;

  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-line-soft bg-surface p-4 shadow-float md:flex-row md:items-end md:gap-6 md:p-4 md:pl-6">
      <div className="flex flex-col gap-3 md:flex-1">
        <span className="text-xs font-semibold tracking-[0.02em] text-text-muted">
          {t("when")}
        </span>
        <SegmentedControl
          value={customDate ? "date" : when}
          onChange={(v) => v !== "date" && setWhen(v as WhenOption)}
          options={[
            { value: "this", label: t("thisWeekend"), hint: thisLabel },
            { value: "next", label: t("nextWeekend"), hint: nextLabel },
            {
              value: "date",
              label: t("ownDate"),
              hint: customDate
                ? new Date(`${customDate}T00:00:00Z`).toLocaleDateString(
                    locale,
                    {
                      day: "numeric",
                      month: "short",
                      timeZone: "UTC",
                    },
                  )
                : t("pickDate"),
              input: (
                <input
                  type="date"
                  min={today}
                  aria-label={t("ownDate")}
                  className="absolute inset-0 cursor-pointer opacity-0"
                  onClick={(e) => e.currentTarget.showPicker?.()}
                  onChange={(e) =>
                    e.target.value && setWhen(e.target.value as WhenOption)
                  }
                />
              ),
            },
          ]}
        />
      </div>

      <div className="border-t border-surface-muted pt-2 md:border-t-0 md:border-l md:pt-0 md:pl-6">
        <GuestStepper
          value={guests}
          min={1}
          max={MAX_GUESTS}
          onChange={setGuests}
          label={t("guests")}
          valueLabel={tf("guests", { n: guests })}
          decreaseLabel={t("fewerGuests")}
          increaseLabel={t("moreGuests")}
        />
      </div>

      <div className="flex flex-col gap-3 md:w-72">
        <Link
          href={catalogHref({ when, guests })}
          className="flex h-14 items-center justify-center gap-2.5 rounded-2xl bg-accent text-base font-semibold text-white"
        >
          <SearchIcon />
          {t("show", { variants: tf("variants", { n: count }) })}
        </Link>
        <p className="flex items-center justify-center gap-2 text-xs text-text-muted md:hidden">
          <span className="size-[7px] rounded-full bg-status-free" />
          {t("ownersUpdate")}
        </p>
      </div>
    </div>
  );
}
