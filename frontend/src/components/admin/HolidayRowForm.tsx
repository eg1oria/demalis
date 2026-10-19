"use client";

import { type FormEvent, useState, useTransition } from "react";
import { setHolidayNight } from "@/app/admin/(panel)/holidays/actions";
import {
  AVAILABILITY_STATUSES,
  type AvailabilityStatus,
} from "@/lib/places/constants";
import { inputClass, secondaryButtonClass } from "./ui";

/** Статус и цена объекта на праздничную ночь — правка за владельца. */
export function HolidayRowForm({
  placeId,
  night,
  status: initialStatus,
  price: initialPrice,
}: {
  placeId: string;
  night: string;
  status: AvailabilityStatus | null;
  price: number | null;
}) {
  const [status, setStatus] = useState(initialStatus ?? "");
  const [price, setPrice] = useState(initialPrice ? String(initialPrice) : "");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const amount = price.replace(/\s/g, "");
    if (amount && !/^\d+$/.test(amount)) {
      setMessage("Цена — целое число");
      return;
    }
    setMessage(null);
    startTransition(async () => {
      const { error } = await setHolidayNight(
        placeId,
        night,
        (status || null) as AvailabilityStatus | null,
        status && status !== "full" && amount ? Number(amount) : null,
      );
      setMessage(error ? `Ошибка: ${error}` : "Сохранено");
    });
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-1">
      <div className="flex flex-wrap gap-2">
        <select
          aria-label="Статус на ночь"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className={`${inputClass} w-40`}
        >
          <option value="">Не отмечено</option>
          {Object.entries(AVAILABILITY_STATUSES).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <input
          aria-label="Цена за ночь, ₸"
          inputMode="numeric"
          placeholder="Цена, ₸"
          value={price}
          disabled={!status || status === "full"}
          onChange={(e) => setPrice(e.target.value)}
          className={`${inputClass} w-32`}
        />
        <button
          type="submit"
          disabled={pending}
          className={secondaryButtonClass}
        >
          {pending ? "…" : "Сохранить"}
        </button>
      </div>
      {message && (
        <span role="status" className="text-xs text-text-muted">
          {message}
        </span>
      )}
    </form>
  );
}
