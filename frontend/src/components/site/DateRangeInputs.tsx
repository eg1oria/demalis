"use client";

import { useTranslations } from "next-intl";
import { MAX_NIGHTS } from "@/lib/catalog/filters";
import { addDays, type IsoDate, toIsoDate } from "@/lib/dates";

const shift = (iso: IsoDate, days: number) =>
  toIsoDate(addDays(new Date(`${iso}T00:00:00Z`), days));

/**
 * Заезд и выезд (до MAX_NIGHTS ночей). Новый заезд позже выезда — выезд
 * сдвигается на следующий день. onChange — только когда обе даты верные.
 */
export function DateRangeInputs({
  checkIn,
  checkOut,
  today,
  onChange,
}: {
  checkIn: IsoDate | null;
  checkOut: IsoDate | null;
  today: IsoDate;
  onChange: (range: { checkIn: IsoDate; checkOut: IsoDate }) => void;
}) {
  const t = useTranslations("Catalog");
  const field =
    "h-11 w-full min-w-0 rounded-[10px] border border-line bg-surface px-2 text-[15px] text-text outline-none focus:border-text";

  return (
    <div className="grid grid-cols-2 gap-2">
      <label className="flex flex-col gap-1 text-xs text-text-muted">
        {t("checkIn")}
        <input
          type="date"
          min={today}
          value={checkIn ?? ""}
          onChange={(e) => {
            const next = e.target.value;
            if (!next) return;
            const out =
              checkOut && checkOut > next && checkOut <= shift(next, MAX_NIGHTS)
                ? checkOut
                : shift(next, 1);
            onChange({ checkIn: next, checkOut: out });
          }}
          className={field}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-text-muted">
        {t("checkOut")}
        <input
          type="date"
          min={checkIn ? shift(checkIn, 1) : shift(today, 1)}
          max={checkIn ? shift(checkIn, MAX_NIGHTS) : undefined}
          value={checkOut ?? ""}
          onChange={(e) => {
            const next = e.target.value;
            if (!next) return;
            const start = checkIn && checkIn < next ? checkIn : shift(next, -1);
            onChange({ checkIn: start, checkOut: next });
          }}
          className={field}
        />
      </label>
    </div>
  );
}
