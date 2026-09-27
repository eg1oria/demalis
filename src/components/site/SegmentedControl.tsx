"use client";

import type { ReactNode } from "react";

type Option = {
  value: string;
  label: string;
  hint?: string;
  input?: ReactNode;
};

/** Сегменты «Эти выходные / Следующие / Своя дата». Выбранный — фон text, белый текст. */
export function SegmentedControl({
  value,
  options,
  onChange,
}: {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
}) {
  return (
    <div
      className="grid gap-1.5"
      style={{
        gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`,
      }}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <label
            key={option.value}
            className={`relative flex min-h-15 cursor-pointer flex-col justify-center gap-0.5 rounded-[14px] border px-3 py-2 ${
              selected
                ? "border-text bg-text text-white"
                : "border-line bg-bg text-text"
            }`}
          >
            {option.input ?? (
              <input
                type="radio"
                className="sr-only"
                checked={selected}
                onChange={() => onChange(option.value)}
              />
            )}
            <span className="text-sm leading-tight font-semibold">
              {option.label}
            </span>
            {option.hint && (
              <span
                className={`text-xs leading-tight ${selected ? "text-white/70" : "text-text-muted"}`}
              >
                {option.hint}
              </span>
            )}
          </label>
        );
      })}
    </div>
  );
}
