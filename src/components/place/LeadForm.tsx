"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  type FormEvent,
  startTransition,
  useActionState,
  useState,
} from "react";
import {
  type LeadFormState,
  submitLead,
} from "@/app/[locale]/place/[slug]/actions";
import { GuestStepper } from "@/components/site/GuestStepper";
import { WhatsAppIcon } from "@/components/site/Icons";
import { MAX_GUESTS } from "@/lib/catalog/filters";
import { addDays, type IsoDate, toIsoDate } from "@/lib/dates";
import { goHref } from "@/lib/go";
import { HONEYPOT_FIELD } from "@/lib/leads/constants";
import { LEAD_LIMITS, type LeadField } from "@/lib/leads/validate";

const nextDay = (iso: IsoDate) =>
  toIsoDate(addDays(new Date(`${iso}T00:00:00Z`), 1));

const inputClass =
  "h-12 w-full min-w-0 rounded-[14px] border border-line bg-surface px-3.5 text-base outline-none focus:border-text aria-invalid:border-status-limited";
const labelClass = "flex flex-col gap-1.5 text-[13px] text-text-muted";

/** Форма заявки на странице объекта. После отправки — экран «Заявка отправлена». */
export function LeadForm({
  placeId,
  today,
  checkIn,
  checkOut,
  guests: initialGuests,
}: {
  placeId: string;
  /** Сегодня по Алматы — раньше заехать нельзя. */
  today: IsoDate;
  /** Даты и гости подставляются из фильтра каталога. */
  checkIn?: IsoDate;
  checkOut?: IsoDate;
  guests?: number;
}) {
  const t = useTranslations("LeadForm");
  const tf = useTranslations("Format");
  const tPlace = useTranslations("Place");
  const tHome = useTranslations("HomePage");
  const locale = useLocale();
  const [state, action, pending] = useActionState<LeadFormState, FormData>(
    submitLead,
    { status: "idle" },
  );
  const [guests, setGuests] = useState(initialGuests ?? 2);
  const [dateFrom, setDateFrom] = useState(checkIn ?? "");

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
        className="flex flex-col gap-4 rounded-3xl bg-status-free-bg p-5"
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
        <a
          href={goHref("whatsapp", placeId, {
            dates: state.dates,
            guests: state.guests,
            locale,
          })}
          target="_blank"
          rel="noopener nofollow"
          className="flex h-13 items-center justify-center gap-2 rounded-2xl bg-accent px-4.5 text-[15px] font-semibold text-white"
        >
          <WhatsAppIcon size={19} />
          {tPlace("writeWhatsApp")}
        </a>
      </div>
    );
  }

  // Пока идёт повторная отправка, старые ошибки не показываем.
  const failed = state.status === "error" && !pending;
  const errors = failed ? (state.errors ?? {}) : {};
  const formError = failed ? state.form : undefined;
  const fieldProps = (field: LeadField) => ({
    name: field,
    "aria-invalid": errors[field] ? true : undefined,
    "aria-describedby": errors[field] ? `lead-${field}-error` : undefined,
  });
  const error = (field: LeadField) =>
    errors[field] && (
      <span
        id={`lead-${field}-error`}
        className="text-[13px] text-status-limited-text"
      >
        {t(`error_${field}_${errors[field]}` as Parameters<typeof t>[0])}
      </span>
    );

  return (
    <form
      onSubmit={onSubmit}
      className="relative flex flex-col gap-4 rounded-3xl border border-line-soft bg-surface p-4"
    >
      <input type="hidden" name="placeId" value={placeId} />
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
          {...fieldProps("name")}
          required
          maxLength={LEAD_LIMITS.name}
          autoComplete="name"
          className={inputClass}
        />
        {error("name")}
      </label>

      <label className={labelClass}>
        {t("phone")}
        <input
          {...fieldProps("phone")}
          type="tel"
          required
          inputMode="tel"
          autoComplete="tel"
          placeholder={t("phonePlaceholder")}
          className={inputClass}
        />
        {error("phone")}
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className={labelClass}>
          {t("dateFrom")}
          <input
            {...fieldProps("dateFrom")}
            type="date"
            required
            min={today}
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className={inputClass}
          />
          {error("dateFrom")}
        </label>
        <label className={labelClass}>
          {t("dateTo")}
          <input
            {...fieldProps("dateTo")}
            type="date"
            required
            min={nextDay(dateFrom || today)}
            defaultValue={checkOut}
            className={inputClass}
          />
          {error("dateTo")}
        </label>
      </div>

      <div className="flex flex-col gap-1.5">
        <input type="hidden" name="guests" value={guests} />
        <GuestStepper
          value={guests}
          min={1}
          max={MAX_GUESTS}
          onChange={setGuests}
          label={t("guests")}
          valueLabel={tf("guests", { n: guests })}
          decreaseLabel={tHome("fewerGuests")}
          increaseLabel={tHome("moreGuests")}
        />
        {error("guests")}
      </div>

      <label className={labelClass}>
        <span>
          {t("comment")}{" "}
          <span className="text-text-faint">· {t("optional")}</span>
        </span>
        <textarea
          {...fieldProps("comment")}
          maxLength={LEAD_LIMITS.comment}
          rows={3}
          placeholder={t("commentPlaceholder")}
          className="min-h-24 w-full rounded-[14px] border border-line bg-surface px-3.5 py-3 text-base outline-none focus:border-text aria-invalid:border-status-limited"
        />
        {error("comment")}
      </label>

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
