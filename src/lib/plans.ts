import {
  PLAN_FEATURES,
  PROMOTED_SLOTS,
  PRO_REMINDER_DAYS,
} from "@/config/pricing";
import type { IsoDate } from "@/lib/dates";
import type { Plan } from "@/lib/places/constants";

type PlanFields = { plan: Plan; pro_until: string | null };

/** Тариф на сегодня: Pro с истёкшим сроком — уже free (даже до ночного cron). */
export function effectivePlan(place: PlanFields, today: IsoDate): Plan {
  return place.plan === "pro" && (!place.pro_until || place.pro_until >= today)
    ? "pro"
    : "free";
}

export function planFeatures(place: PlanFields, today: IsoDate) {
  return PLAN_FEATURES[effectivePlan(place, today)];
}

/** Продвижение действует по featured_until включительно. */
export function isFeatured(
  place: { featured_until: string | null },
  today: IsoDate,
): boolean {
  return Boolean(place.featured_until && place.featured_until >= today);
}

/** Перемешивание, стабильное в течение дня: FNV-1a + финальное перемешивание битов. */
function dayHash(id: string, today: IsoDate): number {
  let h = 0x811c9dc5;
  for (const ch of `${today}:${id}`)
    h = Math.imul(h ^ ch.charCodeAt(0), 0x01000193);
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

/**
 * «Рекомендуемые»: до PROMOTED_SLOTS объектов с продвижением — наверх,
 * с пометкой «Реклама». Если продвигаемых больше, наверх попадают разные
 * по дням (порядок меняется раз в сутки), остальные стоят на своих местах.
 */
export function promote<
  T extends { id: string; featured_until: string | null },
>(
  places: T[],
  today: IsoDate,
  slots: number = PROMOTED_SLOTS,
): (T & { promoted?: true })[] {
  const top = places
    .filter((p) => isFeatured(p, today))
    .sort((a, b) => dayHash(a.id, today) - dayHash(b.id, today))
    .slice(0, slots);
  const ids = new Set(top.map((p) => p.id));
  return [
    ...top.map((p) => ({ ...p, promoted: true as const })),
    ...places.filter((p) => !ids.has(p.id)),
  ];
}

const daysBetween = (from: IsoDate, to: IsoDate) =>
  Math.round(
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 864e5,
  );

/** Пора ли напомнить владельцу, что Pro скоро закончится (один раз на каждую дату окончания). */
export function proReminderDue(
  place: PlanFields & { pro_reminded_for: string | null },
  today: IsoDate,
  days: number = PRO_REMINDER_DAYS,
): boolean {
  if (place.plan !== "pro" || !place.pro_until) return false;
  const left = daysBetween(today, place.pro_until);
  return (
    left >= 0 && left <= days && place.pro_reminded_for !== place.pro_until
  );
}
