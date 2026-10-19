// Копия: backend/src/shared/groups/validate.ts — менять вместе.
import { addDays, type IsoDate, toIsoDate } from "@/lib/dates";
import { normalizeKzPhone } from "@/lib/phone";
import {
  AMENITIES,
  type Amenity,
  DIRECTIONS,
  type Direction,
} from "@/lib/places/constants";

/** «Подберём за вас»: заявка большой компании. Подписи — для админки. */
export const GROUP_OCCASIONS = {
  corporate: "Корпоратив",
  birthday: "День рождения",
  wedding: "Свадьба, юбилей",
  other: "Другое",
} as const;

export const GROUP_STATUSES = {
  new: "Новая",
  in_progress: "Подбираем",
  offered: "Отправили варианты",
  won: "Забронировали",
  lost: "Не получилось",
} as const;

export type GroupOccasion = keyof typeof GROUP_OCCASIONS;
export type GroupStatus = keyof typeof GROUP_STATUSES;

export const GROUP_LIMITS = {
  minGuests: 15,
  maxGuests: 500,
  name: 100,
  comment: 1000,
  maxBudget: 100_000_000,
  daysAhead: 365,
  maxNights: 30,
} as const;

/** Пожелания, которые можно отметить в форме (ключи удобств объекта). */
export const GROUP_AMENITIES = [
  "has_banya",
  "has_chan",
  "has_pool",
  "has_bbq",
  "has_kitchen",
  "has_wifi",
] as const satisfies readonly Amenity[];

export type GroupField =
  | "name"
  | "phone"
  | "occasion"
  | "guests"
  | "dateFrom"
  | "dateTo"
  | "budget"
  | "direction"
  | "amenities"
  | "comment"
  | "consent";

export type GroupErrorCode =
  | "required"
  | "tooLong"
  | "invalid"
  | "tooFew"
  | "tooMany"
  | "past"
  | "tooFar"
  | "beforeFrom"
  | "tooManyNights";

export type GroupRequestInput = {
  name: string;
  phone: string;
  occasion: GroupOccasion;
  guests: number;
  date_from: IsoDate | null;
  date_to: IsoDate | null;
  budget: number | null;
  direction: Direction | null;
  amenities: Amenity[];
  comment: string | null;
};

/** Удобства приходят строкой через запятую (из чекбоксов формы). */
export type RawGroupInput = Partial<Record<GroupField, string>>;

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
 * Проверка заявки «Подберём за вас». today — сегодня по Алматы.
 * Даты необязательны (компания может ещё выбирать), но если указаны — обе.
 */
export function validateGroupRequest(
  raw: RawGroupInput,
  today: IsoDate,
):
  | { ok: true; data: GroupRequestInput }
  | { ok: false; errors: Partial<Record<GroupField, GroupErrorCode>> } {
  const errors: Partial<Record<GroupField, GroupErrorCode>> = {};

  const name = raw.name?.trim().replace(/\s+/g, " ") ?? "";
  if (!name) errors.name = "required";
  else if (name.length > GROUP_LIMITS.name) errors.name = "tooLong";

  const rawPhone = raw.phone?.trim() ?? "";
  const phone = normalizeKzPhone(rawPhone);
  if (!rawPhone) errors.phone = "required";
  else if (!phone) errors.phone = "invalid";

  const occasion = raw.occasion ?? "";
  if (!(occasion in GROUP_OCCASIONS)) errors.occasion = "required";

  const guestsRaw = raw.guests?.trim() ?? "";
  const guests = Number(guestsRaw);
  if (!guestsRaw) errors.guests = "required";
  else if (!Number.isInteger(guests)) errors.guests = "invalid";
  else if (guests < GROUP_LIMITS.minGuests) errors.guests = "tooFew";
  else if (guests > GROUP_LIMITS.maxGuests) errors.guests = "tooMany";

  const dateFrom = parseDate(raw.dateFrom);
  const dateTo = parseDate(raw.dateTo);
  const lastDay = toIsoDate(
    addDays(new Date(`${today}T00:00:00Z`), GROUP_LIMITS.daysAhead),
  );
  if (raw.dateFrom || raw.dateTo) {
    if (!raw.dateFrom) errors.dateFrom = "required";
    else if (!dateFrom) errors.dateFrom = "invalid";
    else if (dateFrom < today) errors.dateFrom = "past";
    else if (dateFrom > lastDay) errors.dateFrom = "tooFar";

    if (!raw.dateTo) errors.dateTo = "required";
    else if (!dateTo) errors.dateTo = "invalid";
    else if (dateFrom && dateTo <= dateFrom) errors.dateTo = "beforeFrom";
    else if (
      dateFrom &&
      nightsBetween(dateFrom, dateTo) > GROUP_LIMITS.maxNights
    )
      errors.dateTo = "tooManyNights";
  }

  const budgetRaw = raw.budget?.replace(/[\s ₸]/g, "") ?? "";
  const budget = budgetRaw ? Number(budgetRaw) : null;
  if (
    budget !== null &&
    (!Number.isInteger(budget) || budget < 0 || budget > GROUP_LIMITS.maxBudget)
  )
    errors.budget = "invalid";

  const direction = raw.direction?.trim() || null;
  if (direction && !(direction in DIRECTIONS)) errors.direction = "invalid";

  const amenities = [
    ...new Set((raw.amenities ?? "").split(",").filter(Boolean)),
  ];
  if (amenities.some((a) => !(a in AMENITIES))) errors.amenities = "invalid";

  const comment = raw.comment?.trim() ?? "";
  if (comment.length > GROUP_LIMITS.comment) errors.comment = "tooLong";

  if (raw.consent !== "on") errors.consent = "required";

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    data: {
      name,
      phone: phone!,
      occasion: occasion as GroupOccasion,
      guests,
      date_from: dateFrom,
      date_to: dateTo,
      budget,
      direction: direction as Direction | null,
      amenities: amenities as Amenity[],
      comment: comment || null,
    },
  };
}
