import { addDays, type IsoDate, toIsoDate } from "@/lib/dates";
import type { AvailabilityStatus } from "@/lib/places/constants";
import { BOT_TEXTS, type BotLang, isBotLang } from "./texts";

/**
 * Данные кнопок бота (callback_data, не больше 64 байт).
 * Черновик отметок хранится прямо в кнопках: так боту не нужна своя таблица
 * для незаконченных правок, а «Готово» сохраняет всё разом.
 */

/** Сколько дней показывать в «Отметить даты». */
export const BOT_DAYS = 14;

/** Статус дня в черновике: null — не отмечено (⚪). */
export type DraftStatus = AvailabilityStatus | null;

const TO_CHAR: Record<AvailabilityStatus, string> = {
  free: "f",
  limited: "l",
  full: "x",
};
const FROM_CHAR: Record<string, DraftStatus> = {
  "0": null,
  f: "free",
  l: "limited",
  x: "full",
};

export function encodeDraft(statuses: DraftStatus[]): string {
  return statuses.map((s) => (s ? TO_CHAR[s] : "0")).join("");
}

export function decodeDraft(draft: string): DraftStatus[] {
  return [...draft].map((c) => FROM_CHAR[c] ?? null);
}

/** По кругу: 🟢 → 🟡 → 🔴 → 🟢. Не отмеченный день становится 🟢. */
export function cycleStatus(status: DraftStatus): AvailabilityStatus {
  if (status === "free") return "limited";
  if (status === "limited") return "full";
  return "free";
}

export const STATUS_EMOJI: Record<AvailabilityStatus, string> = {
  free: "🟢",
  limited: "🟡",
  full: "🔴",
};

/** «Сб 04.10 🟢» */
export function dayLabel(
  date: IsoDate,
  status: DraftStatus,
  lang: BotLang,
): string {
  const d = new Date(`${date}T00:00:00Z`);
  const weekday = BOT_TEXTS[lang].weekdays[d.getUTCDay()];
  return `${weekday} ${date.slice(8, 10)}.${date.slice(5, 7)} ${status ? STATUS_EMOJI[status] : "⚪"}`;
}

/** Дни черновика: BOT_DAYS подряд начиная со start. */
export function draftDates(start: IsoDate): IsoDate[] {
  const first = new Date(`${start}T00:00:00Z`);
  return Array.from({ length: BOT_DAYS }, (_, i) =>
    toIsoDate(addDays(first, i)),
  );
}

// ── Сжатие uuid и дат, чтобы уложиться в 64 байта ─────────────────────────

const HEX32 = /^[0-9a-f]{32}$/;

const packId = (uuid: string) => uuid.toLowerCase().replace(/-/g, "");
const unpackId = (hex: string) =>
  `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
const packDate = (iso: IsoDate) => iso.slice(2).replace(/-/g, "");
function unpackDate(yymmdd: string): IsoDate | null {
  if (!/^\d{6}$/.test(yymmdd)) return null;
  const iso = `20${yymmdd.slice(0, 2)}-${yymmdd.slice(2, 4)}-${yymmdd.slice(4)}`;
  const d = new Date(`${iso}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && toIsoDate(d) === iso ? iso : null;
}

export type Callback =
  | { kind: "lang"; lang: BotLang }
  | { kind: "menu"; action: "dates" }
  | { kind: "pick"; placeId: string }
  | {
      kind: "toggle";
      placeId: string;
      start: IsoDate;
      draft: string;
      index: number;
    }
  | { kind: "save"; placeId: string; start: IsoDate; draft: string }
  | { kind: "lead"; leadId: string; action: "contacted" | "noAnswer" };

export function buildCallback(cb: Callback): string {
  switch (cb.kind) {
    case "lang":
      return `lang:${cb.lang}`;
    case "menu":
      return `menu:${cb.action}`;
    case "pick":
      return `pick:${packId(cb.placeId)}`;
    case "toggle":
      return `t:${packId(cb.placeId)}:${packDate(cb.start)}:${cb.draft}:${cb.index}`;
    case "save":
      return `s:${packId(cb.placeId)}:${packDate(cb.start)}:${cb.draft}`;
    case "lead":
      return `lead:${packId(cb.leadId)}:${cb.action === "contacted" ? "c" : "n"}`;
  }
}

const DRAFT = new RegExp(`^[0flx]{${BOT_DAYS}}$`);

/** Разбор данных кнопки. Всё подозрительное → null. */
export function parseCallback(data: string): Callback | null {
  const [kind, ...parts] = data.split(":");
  const id = (hex: string | undefined) =>
    hex && HEX32.test(hex) ? unpackId(hex) : null;

  if (kind === "lang" && parts.length === 1 && isBotLang(parts[0]))
    return { kind: "lang", lang: parts[0] };
  if (kind === "menu" && parts.length === 1 && parts[0] === "dates")
    return { kind: "menu", action: "dates" };
  if (kind === "pick" && parts.length === 1) {
    const placeId = id(parts[0]);
    return placeId ? { kind: "pick", placeId } : null;
  }
  if (
    (kind === "t" && parts.length === 4) ||
    (kind === "s" && parts.length === 3)
  ) {
    const placeId = id(parts[0]);
    const start = unpackDate(parts[1]);
    const draft = parts[2];
    if (!placeId || !start || !DRAFT.test(draft)) return null;
    if (kind === "s") return { kind: "save", placeId, start, draft };
    const index = Number(parts[3]);
    return Number.isInteger(index) &&
      index >= 0 &&
      index < BOT_DAYS &&
      /^\d+$/.test(parts[3])
      ? { kind: "toggle", placeId, start, draft, index }
      : null;
  }
  if (kind === "lead" && parts.length === 2) {
    const leadId = id(parts[0]);
    if (!leadId || (parts[1] !== "c" && parts[1] !== "n")) return null;
    return {
      kind: "lead",
      leadId,
      action: parts[1] === "c" ? "contacted" : "noAnswer",
    };
  }
  return null;
}
