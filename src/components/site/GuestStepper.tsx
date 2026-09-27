"use client";

import { MinusIcon, PlusIcon, UsersIcon } from "./Icons";

export function GuestStepper({
  value,
  min,
  max,
  onChange,
  label,
  valueLabel,
  decreaseLabel,
  increaseLabel,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  label: string;
  valueLabel: string;
  decreaseLabel: string;
  increaseLabel: string;
}) {
  const button =
    "flex size-11 items-center justify-center rounded-full border border-line bg-surface disabled:opacity-40";

  return (
    <div className="flex items-center justify-between gap-4 pt-1.5">
      <div className="flex items-center gap-2.5">
        <UsersIcon size={22} className="text-text-secondary" />
        <div className="flex flex-col">
          <span className="text-xs text-text-muted">{label}</span>
          <span className="text-base font-semibold whitespace-nowrap">
            {valueLabel}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={decreaseLabel}
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
          className={button}
        >
          <MinusIcon size={18} />
        </button>
        <span
          className="min-w-5 text-center text-[17px] font-semibold"
          aria-live="polite"
        >
          {value}
        </span>
        <button
          type="button"
          aria-label={increaseLabel}
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + 1))}
          className={button}
        >
          <PlusIcon size={18} />
        </button>
      </div>
    </div>
  );
}
