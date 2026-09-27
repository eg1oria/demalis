"use client";

import { useState, useTransition } from "react";
import { setAvailability } from "@/app/admin/(panel)/places/actions";
import {
  AVAILABILITY_STATUSES,
  type AvailabilityStatus,
} from "@/lib/places/constants";

type Status = AvailabilityStatus | null;
const CYCLE: Status[] = [null, "free", "limited", "full"];

const CELL: Record<AvailabilityStatus | "unknown", string> = {
  free: "bg-status-free-bg text-status-free-text",
  limited: "bg-status-limited-bg text-status-limited-text",
  full: "bg-status-full-bg text-status-full-text line-through",
  unknown: "border border-dashed border-status-unknown-border text-text-faint",
};

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const MONTHS = [
  "янв",
  "фев",
  "мар",
  "апр",
  "мая",
  "июн",
  "июл",
  "авг",
  "сен",
  "окт",
  "ноя",
  "дек",
];

function weekdayIndex(date: string) {
  return (new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7; // пн = 0
}

export function AvailabilityGrid({
  placeId,
  days,
  initial,
}: {
  placeId: string;
  days: string[];
  initial: { date: string; status: AvailabilityStatus; updated_at: string }[];
}) {
  const [statuses, setStatuses] = useState<Record<string, Status>>(() =>
    Object.fromEntries(initial.map((row) => [row.date, row.status])),
  );
  const [lastUpdate, setLastUpdate] = useState<string | null>(() =>
    initial.reduce<string | null>(
      (max, row) => (!max || row.updated_at > max ? row.updated_at : max),
      null,
    ),
  );
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const toggle = (date: string) => {
    const previous = statuses[date] ?? null;
    const next = CYCLE[(CYCLE.indexOf(previous) + 1) % CYCLE.length];
    setStatuses((s) => ({ ...s, [date]: next }));
    setError(null);

    startTransition(async () => {
      const result = await setAvailability(placeId, date, next);
      if (result.error) {
        setStatuses((s) => ({ ...s, [date]: previous }));
        setError(`Не сохранилось (${date}): ${result.error}`);
      } else if (result.updatedAt) {
        setLastUpdate(result.updatedAt);
      }
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3 text-sm text-text-secondary">
        {(["free", "limited", "full", "unknown"] as const).map((s) => (
          <span key={s} className="flex items-center gap-1">
            <span className={`inline-block size-4 rounded ${CELL[s]}`} />
            {s === "unknown" ? "Нет данных" : AVAILABILITY_STATUSES[s]}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-xs text-text-muted">
            {d}
          </div>
        ))}
        {Array.from({ length: weekdayIndex(days[0]) }, (_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {days.map((date) => {
          const status = statuses[date] ?? null;
          const [, month, day] = date.split("-").map(Number);
          return (
            <button
              key={date}
              type="button"
              onClick={() => toggle(date)}
              aria-label={`${date}: ${status ? AVAILABILITY_STATUSES[status] : "нет данных"}`}
              className={`flex min-h-11 flex-col items-center justify-center rounded-[10px] text-sm ${CELL[status ?? "unknown"]}`}
            >
              <span className="font-medium">{day}</span>
              {(day === 1 || date === days[0]) && (
                <span className="text-[10px] leading-none no-underline">
                  {MONTHS[month - 1]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {error && <p className="text-sm text-status-limited-text">{error}</p>}
      <p className="text-sm text-text-muted">
        {lastUpdate
          ? `Последнее обновление: ${new Date(lastUpdate).toLocaleString("ru-RU", { timeZone: "Asia/Almaty" })}`
          : "Занятость ещё не отмечалась"}
      </p>
    </div>
  );
}
