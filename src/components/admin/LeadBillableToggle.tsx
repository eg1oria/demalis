"use client";

import { useState, useTransition } from "react";
import { setLeadBillable } from "@/app/admin/(panel)/leads/actions";

/** Флаг «платная заявка»: сохраняется сразу при нажатии. */
export function LeadBillableToggle({
  id,
  billable: initial,
}: {
  id: string;
  billable: boolean;
}) {
  const [billable, setBillable] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onChange = (next: boolean) => {
    setBillable(next);
    setError(null);
    startTransition(async () => {
      const result = await setLeadBillable(id, next);
      if (result.error) {
        setBillable(!next);
        setError(`Ошибка: ${result.error}`);
      }
    });
  };

  return (
    <label className="flex min-h-11 items-center gap-2 text-sm text-text-secondary">
      <input
        type="checkbox"
        checked={billable}
        disabled={pending}
        onChange={(e) => onChange(e.target.checked)}
        className="size-5 accent-accent"
      />
      Платная заявка
      {error && <span className="text-status-limited-text">{error}</span>}
    </label>
  );
}
