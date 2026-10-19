"use client";

import { useTranslations } from "next-intl";
import { type FormEvent, startTransition, useActionState } from "react";
import {
  type ReviewFormState,
  submitReview,
} from "@/app/[locale]/review/[token]/actions";
import { Link } from "@/i18n/navigation";
import { HONEYPOT_FIELD } from "@/lib/leads/constants";
import { REVIEW_LIMITS, type ReviewField } from "@/lib/reviews/validate";

const inputClass =
  "h-12 w-full min-w-0 rounded-[10px] border border-line bg-surface px-3.5 text-base outline-none transition-colors focus:border-text aria-invalid:border-status-limited";
const labelClass = "flex flex-col gap-1.5 text-[13px] text-text-muted";

/** Форма отзыва по личной ссылке. После отправки — «Спасибо». */
export function ReviewForm({
  token,
  name,
  placeSlug,
}: {
  token: string;
  /** Имя из заявки — гость может поправить. */
  name: string;
  /** Ссылка «Вернуться к объекту», если он опубликован. */
  placeSlug: string | null;
}) {
  const t = useTranslations("ReviewForm");
  const [state, action, pending] = useActionState<ReviewFormState, FormData>(
    submitReview.bind(null, token),
    { status: "idle" },
  );

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => action(formData));
  };

  if (
    state.status === "sent" ||
    (state.status === "error" && state.form === "used")
  )
    return (
      <div
        role="status"
        className="flex flex-col gap-3 rounded-2xl bg-status-free-bg p-5"
      >
        <span className="text-lg font-medium text-status-block-title">
          {state.status === "sent" ? t("sentTitle") : t("usedTitle")}
        </span>
        <p className="text-[15px] text-status-block-text">{t("sentText")}</p>
        {placeSlug && (
          <Link
            href={`/place/${placeSlug}`}
            className="w-fit text-[15px] text-text underline underline-offset-2"
          >
            {t("toPlace")}
          </Link>
        )}
      </div>
    );

  const failed = state.status === "error" && !pending;
  const errors = failed ? (state.errors ?? {}) : {};
  const formError = failed ? state.form : undefined;
  const invalid = (field: ReviewField) => ({
    "aria-invalid": errors[field] ? true : undefined,
    "aria-describedby": errors[field] ? `review-${field}-error` : undefined,
  });
  const error = (field: ReviewField) =>
    errors[field] && (
      <span
        id={`review-${field}-error`}
        className="text-[13px] text-status-limited-text"
      >
        {t(`error_${field}_${errors[field]}` as Parameters<typeof t>[0])}
      </span>
    );

  return (
    <form
      onSubmit={onSubmit}
      className="relative flex flex-col gap-5 rounded-2xl border border-line bg-surface p-4 md:p-6"
    >
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

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-[13px] text-text-muted">
          {t("rating")}
        </legend>
        {/* Звёзды: радиокнопки в обратном порядке, чтобы подсветка шла слева. */}
        <div className="flex w-fit flex-row-reverse justify-end gap-1">
          {[5, 4, 3, 2, 1].map((n) => (
            <label
              key={n}
              title={t(`star${n}` as Parameters<typeof t>[0])}
              className="peer cursor-pointer text-[34px] leading-none text-line-strong transition-colors peer-hover:text-status-limited hover:text-status-limited has-checked:text-status-limited peer-has-checked:text-status-limited has-focus-visible:outline-2 has-focus-visible:outline-text"
            >
              <input
                type="radio"
                name="rating"
                value={n}
                required
                className="sr-only"
                {...invalid("rating")}
              />
              <span aria-hidden="true">★</span>
              <span className="sr-only">
                {t(`star${n}` as Parameters<typeof t>[0])}
              </span>
            </label>
          ))}
        </div>
        {error("rating")}
      </fieldset>

      <label className={labelClass}>
        {t("text")}
        <textarea
          name="text"
          {...invalid("text")}
          required
          minLength={REVIEW_LIMITS.minText}
          maxLength={REVIEW_LIMITS.maxText}
          rows={5}
          placeholder={t("textPlaceholder")}
          className="min-h-32 w-full rounded-[10px] border border-line bg-surface px-3.5 py-3 text-base outline-none transition-colors focus:border-text aria-invalid:border-status-limited"
        />
        {error("text")}
      </label>

      <label className={labelClass}>
        {t("name")}
        <input
          name="name"
          {...invalid("name")}
          required
          maxLength={REVIEW_LIMITS.name}
          defaultValue={name}
          autoComplete="given-name"
          className={inputClass}
        />
        <span className="text-[13px] text-text-faint">{t("nameHint")}</span>
        {error("name")}
      </label>

      <div className="flex flex-col gap-1.5">
        <label className="flex min-h-11 items-start gap-3 text-sm text-text-secondary">
          <input
            type="checkbox"
            name="consent"
            {...invalid("consent")}
            required
            className="mt-0.5 size-5 flex-none accent-text"
          />
          <span>
            {t.rich("consent", {
              link: (chunks) => (
                <Link
                  href="/privacy"
                  target="_blank"
                  className="text-text underline underline-offset-2"
                >
                  {chunks}
                </Link>
              ),
            })}
          </span>
        </label>
        {error("consent")}
      </div>

      {(formError || Object.keys(errors).length > 0) && (
        <p
          role="alert"
          className="rounded-[10px] bg-status-limited-bg p-3 text-sm text-status-limited-text"
        >
          {formError ? t(`error_${formError}`) : t("fixErrors")}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="flex h-12 items-center justify-center rounded-[10px] bg-text px-4.5 text-[15px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? t("sending") : t("submit")}
      </button>
    </form>
  );
}
