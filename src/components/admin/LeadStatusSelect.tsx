"use client";

import { useState, useTransition } from "react";
import { setLeadStatus } from "@/app/admin/(panel)/leads/actions";
import { LEAD_STATUSES, type LeadStatus } from "@/lib/leads/constants";
import { inputClass } from "./ui";

/** Смена статуса заявки: сохраняется сразу при выборе. */
export function LeadStatusSelect({
  id,
  status: initial,
}: {
  id: string;
  status: LeadStatus;
}) {
  const [status, setStatus] = useState(initial);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onChange = (next: LeadStatus) => {
    const previous = status;
    setStatus(next);
    setMessage(null);
    startTransition(async () => {
      const { error } = await setLeadStatus(id, next);
      if (error) {
        setStatus(previous);
        setMessage(`Ошибка: ${error}`);
      } else setMessage("Сохранено");
    });
  };

  return (
    <div className="flex flex-col gap-1">
      <select
        aria-label="Статус заявки"
        value={status}
        disabled={pending}
        onChange={(e) => onChange(e.target.value as LeadStatus)}
        className={`${inputClass} sm:w-56`}
      >
        {Object.entries(LEAD_STATUSES).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      {message && (
        <span role="status" className="text-xs text-text-muted">
          {message}
        </span>
      )}
    </div>
  );
}
