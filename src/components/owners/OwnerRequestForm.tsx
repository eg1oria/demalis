"use client";

import { useTranslations } from "next-intl";
import { type FormEvent, startTransition, useActionState } from "react";
import {
  type OwnerRequestState,
  submitOwnerRequest,
} from "@/app/[locale]/owners/actions";
import { SITE_NAME } from "@/config/site";
import { HONEYPOT_FIELD } from "@/lib/leads/constants";
import {
  OWNER_REQUEST_NAME_MAX,
  type OwnerRequestField,
} from "@/lib/owners/request";
import { DIRECTIONS, PLACE_TYPES } from "@/lib/places/constants";

const inputClass =
  "h-12 w-full min-w-0 rounded-[14px] border border-line bg-surface px-3.5 text-base outline-none focus:border-text aria-invalid:border-status-limited";
const labelClass = "flex flex-col gap-1.5 text-[13px] text-text-muted";

/** Форма «Добавить объект»: создаёт черновик объекта (Этап 7). */
export function OwnerRequestForm() {
  const t = useTranslations("OwnerForm");
  const tTypes = useTranslations("Types");
  const tDir = useTranslations("Directions");
  const [state, action, pending] = useActionState<OwnerRequestState, FormData>(
    submitOwnerRequest,
    { status: "idle" },
  );

  // Отправка без автосброса формы: при ошибке введённое не теряется.
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => action(formData));
  };

  if (state.status === "sent") {
    return (
      <div
        role="status"
        className="flex flex-col gap-3 rounded-3xl bg-status-free-bg p-5"
      >
        <div className="flex items-center gap-3.5">
          <span className="flex size-10 flex-none items-center justify-center rounded-full bg-white text-status-block-icon">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          </span>
          <span className="text-lg font-semibold text-status-block-title">
            {t("sentTitle")}
          </span>
        </div>
        <p className="text-[15px] text-status-block-text">{t("sentText")}</p>
      </div>
    );
  }

  // Пока идёт повторная отправка, старые ошибки не показываем.
  const failed = state.status === "error" && !pending;
  const errors = failed ? (state.errors ?? {}) : {};
  const formError = failed ? state.form : undefined;
  const invalid = (field: OwnerRequestField) => ({
    "aria-invalid": errors[field] ? true : undefined,
    "aria-describedby": errors[field] ? `owner-${field}-error` : undefined,
  });
  const error = (field: OwnerRequestField) =>
    errors[field] && (
      <span
        id={`owner-${field}-error`}
        className="text-[13px] text-status-limited-text"
      >
        {t(`error_${field}_${errors[field]}` as Parameters<typeof t>[0])}
      </span>
    );

  return (
    <form
      onSubmit={onSubmit}
      className="relative flex flex-col gap-4 rounded-3xl border border-line-soft bg-surface p-4 md:p-6"
    >
      {/* Ловушка для ботов: человек это поле не видит. */}
      <div
        aria-hidden="true"
        className="absolute -left-[9999px] h-px w-px overflow-hidden"
      >
        <label>
          {t("honeypot")}
          <input
            type="text"
            name={HONEYPOT_FIELD}
            tabIndex={-1}
            autoComplete="off"
            defaultValue=""
          />
        </label>
      </div>

      <label className={labelClass}>
        {t("name")}
        <input
          name="name"
          {...invalid("name")}
          required
          maxLength={OWNER_REQUEST_NAME_MAX}
          placeholder={t("namePlaceholder")}
          className={inputClass}
        />
        {error("name")}
      </label>

      <label className={labelClass}>
        {t("phone")}
        <input
          name="phone"
          {...invalid("phone")}
          type="tel"
          required
          inputMode="tel"
          autoComplete="tel"
          placeholder={t("phonePlaceholder")}
          className={inputClass}
        />
        {error("phone")}
      </label>

      <label className={labelClass}>
        <span>
          {t("instagram")}{" "}
          <span className="text-text-faint">· {t("optional")}</span>
        </span>
        <input
          name="instagram"
          {...invalid("instagram")}
          autoCapitalize="none"
          autoCorrect="off"
          placeholder={t("instagramPlaceholder")}
          className={inputClass}
        />
        {error("instagram")}
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          {t("direction")}
          <select
            name="direction"
            {...invalid("direction")}
            required
            defaultValue=""
            className={inputClass}
          >
            <option value="" disabled>
              {t("choose")}
            </option>
            {(Object.keys(DIRECTIONS) as (keyof typeof DIRECTIONS)[]).map(
              (d) => (
                <option key={d} value={d}>
                  {tDir(d)}
                </option>
              ),
            )}
          </select>
          {error("direction")}
        </label>
        <label className={labelClass}>
          {t("type")}
          <select
            name="type"
            {...invalid("type")}
            required
            defaultValue=""
            className={inputClass}
          >
            <option value="" disabled>
              {t("choose")}
            </option>
            {(Object.keys(PLACE_TYPES) as (keyof typeof PLACE_TYPES)[]).map(
              (type) => (
                <option key={type} value={type}>
                  {tTypes(type)}
                </option>
              ),
            )}
          </select>
          {error("type")}
        </label>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="flex min-h-11 items-start gap-3 text-sm text-text-secondary">
          <input
            type="checkbox"
            name="consent"
            {...invalid("consent")}
            required
            className="mt-0.5 size-5 flex-none accent-accent"
          />
          {t("consent", { site: SITE_NAME })}
        </label>
        {error("consent")}
      </div>

      {(formError || Object.keys(errors).length > 0) && (
        <p
          role="alert"
          className="rounded-[14px] bg-status-limited-bg p-3 text-sm text-status-limited-text"
        >
          {formError ? t(`error_${formError}`) : t("fixErrors")}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="flex h-13 items-center justify-center rounded-2xl bg-accent px-4.5 text-[15px] font-semibold text-white disabled:opacity-60"
      >
        {pending ? t("sending") : t("submit")}
      </button>
    </form>
  );
}
