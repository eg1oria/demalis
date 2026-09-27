"use client";

import { useActionState } from "react";
import {
  type AddPaymentState,
  addPayment,
} from "@/app/admin/(panel)/places/payments";
import { PAYMENT_KINDS } from "@/lib/payments/validate";
import { inputClass, labelClass, primaryButtonClass } from "./ui";

/** Добавить оплату. После успешного сохранения форма очищается (сброс React). */
export function PaymentForm({
  placeId,
  today,
}: {
  placeId: string;
  today: string;
}) {
  const [state, action, pending] = useActionState<AddPaymentState, FormData>(
    addPayment.bind(null, placeId),
    {},
  );

  return (
    <form action={action} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className={labelClass}>
          Сумма, ₸
          <input
            name="amount"
            inputMode="numeric"
            required
            placeholder="15000"
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          За что
          <select name="kind" defaultValue="pro" className={inputClass}>
            {Object.entries(PAYMENT_KINDS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Дата оплаты
          <input
            name="paid_at"
            type="date"
            required
            defaultValue={today}
            className={inputClass}
          />
        </label>
      </div>
      <label className={labelClass}>
        Комментарий
        <input
          name="comment"
          maxLength={500}
          placeholder="Например: Kaspi, счёт №12, Pro на октябрь"
          className={inputClass}
        />
      </label>
      {state.error && (
        <p
          role="alert"
          className="rounded-[14px] bg-status-limited-bg p-3 text-status-limited-text"
        >
          {state.error}
        </p>
      )}
      {state.ok && !pending && (
        <p role="status" className="text-sm text-status-free-text">
          Оплата сохранена
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className={`${primaryButtonClass} self-start`}
      >
        {pending ? "Сохраняем…" : "Отметить оплату"}
      </button>
    </form>
  );
}
