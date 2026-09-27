"use client";

import { type FormEvent, useActionState, useTransition } from "react";
import {
  type SaveOwnerState,
  saveOwner,
} from "@/app/admin/(panel)/owners/actions";
import type { Tables } from "@/lib/supabase/database.types";
import { cardClass, inputClass, labelClass, primaryButtonClass } from "./ui";

export function OwnerForm({
  owner,
}: {
  owner: Pick<Tables<"owners">, "id" | "name" | "phone"> | null;
}) {
  const [state, formAction] = useActionState<SaveOwnerState, FormData>(
    saveOwner,
    {},
  );
  const [pending, startTransition] = useTransition();

  // Отправляем вручную, чтобы React не сбрасывал поля формы при ошибке.
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  };

  return (
    <form onSubmit={onSubmit} className={`${cardClass} flex flex-col gap-3`}>
      {owner && <input type="hidden" name="id" value={owner.id} />}
      <label className={labelClass}>
        Имя
        <input
          name="name"
          required
          maxLength={100}
          defaultValue={owner?.name ?? ""}
          className={inputClass}
        />
      </label>
      <label className={labelClass}>
        Телефон
        <input
          name="phone"
          type="tel"
          inputMode="tel"
          placeholder="+7 701 123 45 67"
          defaultValue={owner?.phone ?? ""}
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
      <button
        type="submit"
        disabled={pending}
        className={`${primaryButtonClass} self-start`}
      >
        {pending ? "Сохраняем…" : "Сохранить"}
      </button>
    </form>
  );
}
