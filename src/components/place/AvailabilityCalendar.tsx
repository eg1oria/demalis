"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/site/Icons";
import type { DisplayStatus } from "@/lib/availability";

const CELL: Record<DisplayStatus, string> = {
  free: "bg-status-free-bg text-status-free-text",
  limited: "bg-status-limited-bg text-status-limited-text",
  full: "bg-status-full-bg text-status-full-text line-through",
  stale: "border border-dashed border-status-unknown-border text-text-faint",
  unknown: "border border-dashed border-status-unknown-border text-text-faint",
};

const utc = (iso: string) => new Date(`${iso}T00:00:00Z`);

/** Календарь занятости на 30 дней: месяц за месяцем, как в макете. */
export function AvailabilityCalendar({
  days,
  statuses,
  selected,
}: {
  /** 30 дней подряд начиная с сегодняшнего. */
  days: string[];
  statuses: Record<string, DisplayStatus>;
  /** Выбранные в фильтре ночи — обводка 2px. */
  selected: string[];
}) {
  const t = useTranslations("Calendar");
  const tStatus = useTranslations("Status");
  const locale = useLocale();
  const months = [...new Set(days.map((d) => d.slice(0, 7)))];
  // Открываем месяц с выбранными датами, если они есть.
  const [monthIndex, setMonthIndex] = useState(() =>
    Math.max(
      0,
      months.indexOf(selected.find((d) => days.includes(d))?.slice(0, 7) ?? ""),
    ),
  );
  const month = months[monthIndex];
  const inWindow = new Set(days);

  const first = utc(`${month}-01`);
  const lead = (first.getUTCDay() + 6) % 7; // пн = 0
  const daysInMonth = new Date(
    Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0),
  ).getUTCDate();

  // 28.09.2026 — понедельник: берём от него 7 дней подряд для подписей.
  const weekdays = Array.from({ length: 7 }, (_, i) =>
    new Date(Date.UTC(2026, 8, 28 + i)).toLocaleDateString(locale, {
      weekday: "short",
      timeZone: "UTC",
    }),
  );
  const title = first.toLocaleDateString(locale, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <div className="rounded-3xl border border-line-soft bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          aria-label={t("prevMonth")}
          disabled={monthIndex === 0}
          onClick={() => setMonthIndex((i) => i - 1)}
          className="flex size-11 items-center justify-center rounded-full disabled:opacity-30"
        >
          <ChevronLeftIcon size={18} />
        </button>
        <span className="text-base font-semibold capitalize">{title}</span>
        <button
          type="button"
          aria-label={t("nextMonth")}
          disabled={monthIndex === months.length - 1}
          onClick={() => setMonthIndex((i) => i + 1)}
          className="flex size-11 items-center justify-center rounded-full disabled:opacity-30"
        >
          <ChevronRightIcon size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1.5 text-center">
        {weekdays.map((d) => (
          <span key={d} className="pb-1 text-xs text-text-muted capitalize">
            {d}
          </span>
        ))}
        {Array.from({ length: lead }, (_, i) => (
          <span key={`lead-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const date = `${month}-${String(i + 1).padStart(2, "0")}`;
          if (!inWindow.has(date)) {
            return (
              <span
                key={date}
                className="flex aspect-square items-center justify-center text-sm text-line-strong"
              >
                {i + 1}
              </span>
            );
          }
          const status = statuses[date] ?? "unknown";
          return (
            <span
              key={date}
              title={tStatus(status)}
              className={`flex aspect-square items-center justify-center rounded-[10px] text-sm font-medium ${CELL[status]} ${
                selected.includes(date) ? "ring-2 ring-text ring-inset" : ""
              }`}
            >
              {i + 1}
            </span>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-line-soft pt-3 text-xs text-text-secondary">
        {(
          [
            ["free", t("legendFree")],
            ["limited", t("legendLimited")],
            ["full", t("legendFull")],
            ["unknown", t("legendUnknown")],
          ] as const
        ).map(([status, label]) => (
          <span key={status} className="flex items-center gap-1.5">
            <span
              className={`inline-block size-3 rounded-[4px] ${CELL[status]}`}
            />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
