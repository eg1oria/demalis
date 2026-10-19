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
      className={`grid gap-px overflow-hidden rounded-[10px] border border-line bg-line ${
        // Четыре варианта на телефоне не помещаются в ряд — сетка 2×2.
        options.length > 3 ? "grid-cols-2 xl:grid-cols-4" : ""
      }`}
      style={
        options.length > 3
          ? undefined
          : { gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }
      }
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <label
            key={option.value}
            className={`relative flex min-h-14 cursor-pointer flex-col justify-center gap-0.5 px-3 py-2 transition-colors ${
              selected ? "bg-text text-white" : "bg-surface text-text"
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
            <span className="text-sm leading-tight font-medium">
              {option.label}
            </span>
            {option.hint && (
              <span
                className={`tabular text-xs leading-tight ${selected ? "text-white/65" : "text-text-muted"}`}
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
