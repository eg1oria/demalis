import type { IsoDate } from '../shared/dates';

/** "YYYY-MM-DD" → Date для колонок типа date (полночь UTC). */
export function dbDate(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

export function dbDateOrNull(iso: string | null | undefined): Date | null {
  return iso ? dbDate(iso) : null;
}

/** Колонка date → "YYYY-MM-DD". */
export function isoDate(date: Date): IsoDate {
  return date.toISOString().slice(0, 10);
}

export function isoDateOrNull(date: Date | null | undefined): IsoDate | null {
  return date ? isoDate(date) : null;
}
