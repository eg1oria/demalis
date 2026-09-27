"use client";

import { useActionState } from "react";
import {
  inputClass,
  labelClass,
  primaryButtonClass,
} from "@/components/admin/ui";
import { type LoginState, sendMagicLink } from "../actions";

export function LoginForm({ linkError }: { linkError: boolean }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    sendMagicLink,
    {},
  );

  if (state.sentTo) {
    return (
      <p role="status" className="text-text-secondary">
        Ссылка для входа отправлена на{" "}
        <b className="text-text">{state.sentTo}</b>. Откройте письмо на этом же
        устройстве и нажмите на ссылку.
      </p>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      {linkError && (
        <p role="alert" className="text-status-limited-text">
          Ссылка устарела или уже использована. Запросите новую.
        </p>
      )}
      <label className={labelClass}>
        Email
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className={inputClass}
        />
      </label>
      {state.error && (
        <p role="alert" className="text-status-limited-text">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className={primaryButtonClass}>
        {pending ? "Отправляем…" : "Получить ссылку для входа"}
      </button>
    </form>
  );
}
