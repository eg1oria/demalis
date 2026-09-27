import { MAX_GUESTS } from "@/lib/catalog/filters";
import { addDays, type IsoDate, toIsoDate } from "@/lib/dates";
import { normalizeKzPhone } from "@/lib/phone";

/** Поля формы заявки. Ошибка — код, текст подставляет форма на нужном языке. */
export type LeadField =
  "name" | "phone" | "dateFrom" | "dateTo" | "guests" | "comment" | "consent";

export type LeadErrorCode =
  | "required"
  | "tooLong"
  | "invalid"
  | "past"
  | "tooFar"
  | "beforeFrom"
  | "tooManyNights";

export type LeadInput = {
  name: string;
  phone: string;
  date_from: IsoDate;
  date_to: IsoDate;
  guests: number;
  comment: string | null;
};

export type RawLeadInput = Partial<Record<LeadField, string>>;

export const LEAD_LIMITS = {
  name: 100,
  comment: 1000,
  /** Заезд не дальше чем через год. */
  daysAhead: 365,
  /** Самая длинная поездка в одной заявке. */
  maxNights: 30,
} as const;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function parseDate(value: string | undefined): IsoDate | null {
  if (!value || !ISO_DATE.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && toIsoDate(date) === value
    ? value
    : null;
}

const nightsBetween = (from: IsoDate, to: IsoDate) =>
  (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 864e5;

/**
 * Проверка заявки. today — сегодняшняя дата по Алматы (заезд не в прошлом).
 * Даты: date_from — заезд, date_to — выезд (минимум на следующий день).
 */
export function validateLead(
  raw: RawLeadInput,
  today: IsoDate,
):
  | { ok: true; data: LeadInput }
  | { ok: false; errors: Partial<Record<LeadField, LeadErrorCode>> } {
  const errors: Partial<Record<LeadField, LeadErrorCode>> = {};

  const name = raw.name?.trim().replace(/\s+/g, " ") ?? "";
  if (!name) errors.name = "required";
  else if (name.length > LEAD_LIMITS.name) errors.name = "tooLong";

  const rawPhone = raw.phone?.trim() ?? "";
  const phone = normalizeKzPhone(rawPhone);
  if (!rawPhone) errors.phone = "required";
  else if (!phone) errors.phone = "invalid";

  const dateFrom = parseDate(raw.dateFrom);
  const dateTo = parseDate(raw.dateTo);
  const lastDay = toIsoDate(
    addDays(new Date(`${today}T00:00:00Z`), LEAD_LIMITS.daysAhead),
  );
  if (!raw.dateFrom) errors.dateFrom = "required";
  else if (!dateFrom) errors.dateFrom = "invalid";
  else if (dateFrom < today) errors.dateFrom = "past";
  else if (dateFrom > lastDay) errors.dateFrom = "tooFar";

  if (!raw.dateTo) errors.dateTo = "required";
  else if (!dateTo) errors.dateTo = "invalid";
  else if (dateFrom && dateTo <= dateFrom) errors.dateTo = "beforeFrom";
  else if (dateFrom && nightsBetween(dateFrom, dateTo) > LEAD_LIMITS.maxNights)
    errors.dateTo = "tooManyNights";

  const guests = Number(raw.guests);
  if (!Number.isInteger(guests) || guests < 1 || guests > MAX_GUESTS)
    errors.guests = "invalid";

  const comment = raw.comment?.trim() ?? "";
  if (comment.length > LEAD_LIMITS.comment) errors.comment = "tooLong";

  // Согласие на обработку персональных данных (политика — /privacy).
  if (raw.consent !== "on") errors.consent = "required";

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    data: {
      name,
      phone: phone!,
      date_from: dateFrom!,
      date_to: dateTo!,
      guests,
      comment: comment || null,
    },
  };
}
