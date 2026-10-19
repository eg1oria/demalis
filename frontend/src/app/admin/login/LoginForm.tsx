"use client";

import { useActionState } from "react";
import {
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/admin/ui";
import { LOCAL_MAILBOX_URL } from "@/lib/admin/devLogin";
import { devSignIn, type LoginState, sendMagicLink } from "../actions";

export function LoginForm({
  linkError,
  devLogin,
}: {
  linkError: boolean;
  /** Локальная разработка: письма в Mailpit, можно войти без письма. */
  devLogin: boolean;
}) {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    sendMagicLink,
    {},
  );
  const [devState, devAction, devPending] = useActionState<
    LoginState,
    FormData
  >(devSignIn, {});

  const mailbox = (
    <a
      href={LOCAL_MAILBOX_URL}
      target="_blank"
      rel="noopener"
      className="text-text underline underline-offset-2"
    >
      Mailpit
    </a>
  );

  if (state.sentTo) {
    return (
      <div role="status" className="flex flex-col gap-3 text-text-secondary">
        <p>
          Ссылка для входа отправлена на{" "}
          <b className="text-text">{state.sentTo}</b>. Откройте письмо на этом
          же устройстве и нажмите на ссылку.
        </p>
        {devLogin && (
          <p className="text-sm">
            Бэкенд запущен локально — письмо не уходит на настоящую почту, оно в{" "}
            {mailbox}.
          </p>
        )}
      </div>
    );
  }

  const error = devState.error ?? state.error;

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
      {error && (
        <p role="alert" className="text-status-limited-text">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending || devPending}
        className={primaryButtonClass}
      >
        {pending ? "Отправляем…" : "Получить ссылку для входа"}
      </button>
      {devLogin && (
        <div className="flex flex-col gap-2 border-t border-line pt-4">
          <button
            type="submit"
            formAction={devAction}
            disabled={pending || devPending}
            className={secondaryButtonClass}
          >
            {devPending ? "Входим…" : "Войти без письма"}
          </button>
          <p className="text-[13px] text-text-muted">
            Только для локальной разработки: бэкенд на этом компьютере не
            отправляет настоящие письма, они в {mailbox}. На сайте в интернете
            этой кнопки нет.
          </p>
        </div>
      )}
    </form>
  );
}
