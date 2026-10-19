"use client";

import { useTranslations } from "next-intl";
import {
  type FormEvent,
  startTransition,
  useActionState,
  useEffect,
  useState,
} from "react";
import {
  type GroupRequestState,
  submitGroupRequest,
} from "@/app/[locale]/actions";
import { Link } from "@/i18n/navigation";
import { trackEvent } from "@/lib/analytics";
import { addDays, type IsoDate, toIsoDate } from "@/lib/dates";
import {
  GROUP_AMENITIES,
  GROUP_LIMITS,
  GROUP_OCCASIONS,
  type GroupField,
  type GroupOccasion,
} from "@/lib/groups/validate";
import { HONEYPOT_FIELD } from "@/lib/leads/constants";
import { DIRECTIONS } from "@/lib/places/constants";

const inputClass =
  "h-12 w-full min-w-0 rounded-[10px] border border-line bg-surface px-3.5 text-base outline-none transition-colors focus:border-text aria-invalid:border-status-limited";
const labelClass = "flex flex-col gap-1.5 text-[13px] text-text-muted";
/** Чипс-переключатель на скрытом radio/checkbox. */
const pillClass =
  "flex h-10 cursor-pointer items-center rounded-full border border-line px-4 text-sm whitespace-nowrap text-text transition-colors hover:border-text has-checked:border-text has-checked:bg-text has-checked:text-white has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-text";

const nextDay = (iso: IsoDate) =>
  toIsoDate(addDays(new Date(`${iso}T00:00:00Z`), 1));

/** «Подберём за вас»: заявка компании от 15 человек (главная). */
export function GroupRequestForm({
  today,
  occasion: initialOccasion,
}: {
  /** Сегодня по Алматы — раньше заехать нельзя. */
  today: IsoDate;
  occasion?: GroupOccasion;
}) {
  const t = useTranslations("GroupForm");
  const tDir = useTranslations("Directions");
  const tAmenities = useTranslations("Amenities");
  const [state, action, pending] = useActionState<GroupRequestState, FormData>(
    submitGroupRequest,
    { status: "idle" },
  );
  const [dateFrom, setDateFrom] = useState("");
  const [meta, setMeta] = useState<{ occasion: string; guests: number }>();

  // В аналитику — только повод и число гостей, без имени и телефона.
  const sent = state.status === "sent";
  useEffect(() => {
    if (sent && meta) trackEvent("group_request", meta);
  }, [sent, meta]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setMeta({
      occasion: String(formData.get("occasion") ?? ""),
      guests: Number(formData.get("guests")) || 0,
    });
    startTransition(() => action(formData));
  };

  if (sent) {
    return (
      <div
        role="status"
        className="flex flex-col gap-3 rounded-2xl bg-status-free-bg p-5"
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
          <span className="text-lg font-medium text-status-block-title">
            {t("sentTitle")}
          </span>
        </div>
        <p className="text-[15px] text-status-block-text">{t("sentText")}</p>
      </div>
    );
  }

  const failed = state.status === "error" && !pending;
  const errors = failed ? (state.errors ?? {}) : {};
  const formError = failed ? state.form : undefined;
  const invalid = (field: GroupField) => ({
    "aria-invalid": errors[field] ? true : undefined,
    "aria-describedby": errors[field] ? `group-${field}-error` : undefined,
  });
  const error = (field: GroupField) =>
    errors[field] && (
      <span
        id={`group-${field}-error`}
        className="text-[13px] text-status-limited-text"
      >
        {t(`error_${field}_${errors[field]}` as Parameters<typeof t>[0])}
      </span>
    );
  const optional = <span className="text-text-faint">· {t("optional")}</span>;

  return (
    <form
      onSubmit={onSubmit}
      className="relative flex flex-col gap-5 rounded-2xl border border-line bg-surface p-4 md:p-6"
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

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-[13px] text-text-muted">
          {t("occasion")}
        </legend>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(GROUP_OCCASIONS) as GroupOccasion[]).map((key) => (
            <label key={key} className={pillClass}>
              <input
                type="radio"
                name="occasion"
                value={key}
                required
                defaultChecked={key === initialOccasion}
                className="sr-only"
              />
              {t(`occasion_${key}`)}
            </label>
          ))}
        </div>
        {error("occasion")}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          {t("guests")}
          <input
            name="guests"
            {...invalid("guests")}
            type="number"
            inputMode="numeric"
            required
            min={GROUP_LIMITS.minGuests}
            max={GROUP_LIMITS.maxGuests}
            placeholder={t("guestsPlaceholder")}
            className={inputClass}
          />
          {error("guests")}
        </label>
        <label className={labelClass}>
          <span>
            {t("budget")} {optional}
          </span>
          <input
            name="budget"
            {...invalid("budget")}
            inputMode="numeric"
            placeholder={t("budgetPlaceholder")}
            className={inputClass}
          />
          {error("budget")}
        </label>
      </div>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 text-[13px] text-text-muted">
          {t("dates")}{" "}
          <span className="text-text-faint">· {t("datesHint")}</span>
        </legend>
        <div className="grid grid-cols-2 gap-3">
          <label className={labelClass}>
            <span className="sr-only">{t("dateFrom")}</span>
            <input
              name="dateFrom"
              {...invalid("dateFrom")}
              type="date"
              min={today}
              aria-label={t("dateFrom")}
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className={inputClass}
            />
            {error("dateFrom")}
          </label>
          <label className={labelClass}>
            <span className="sr-only">{t("dateTo")}</span>
            <input
              name="dateTo"
              {...invalid("dateTo")}
              type="date"
              aria-label={t("dateTo")}
              min={nextDay(dateFrom || today)}
              required={Boolean(dateFrom)}
              className={inputClass}
            />
            {error("dateTo")}
          </label>
        </div>
      </fieldset>

      <label className={labelClass}>
        {t("direction")}
        <select
          name="direction"
          {...invalid("direction")}
          defaultValue=""
          className={inputClass}
        >
          <option value="">{t("anyDirection")}</option>
          {(Object.keys(DIRECTIONS) as (keyof typeof DIRECTIONS)[])
            .filter((d) => d !== "drugoe")
            .map((d) => (
              <option key={d} value={d}>
                {tDir(d)}
              </option>
            ))}
        </select>
        {error("direction")}
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-[13px] text-text-muted">
          {t("amenities")} {optional}
        </legend>
        <div className="flex flex-wrap gap-2">
          {GROUP_AMENITIES.map((key) => (
            <label key={key} className={pillClass}>
              <input
                type="checkbox"
                name="amenities"
                value={key}
                className="sr-only"
              />
              {tAmenities(key)}
            </label>
          ))}
        </div>
        {error("amenities")}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          {t("name")}
          <input
            name="name"
            {...invalid("name")}
            required
            maxLength={GROUP_LIMITS.name}
            autoComplete="name"
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
      </div>

      <label className={labelClass}>
        <span>
          {t("comment")} {optional}
        </span>
        <textarea
          name="comment"
          {...invalid("comment")}
          maxLength={GROUP_LIMITS.comment}
          rows={3}
          placeholder={t("commentPlaceholder")}
          className="min-h-24 w-full rounded-[10px] border border-line bg-surface px-3.5 py-3 text-base outline-none transition-colors focus:border-text aria-invalid:border-status-limited"
        />
        {error("comment")}
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
