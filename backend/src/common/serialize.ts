import { Prisma } from '../generated/prisma/client';

/** Колонки типа date: в JSON — "YYYY-MM-DD", а не момент времени. */
const DATE_ONLY = new Set([
  'date',
  'date_from',
  'date_to',
  'featured_until',
  'pro_until',
  'pro_reminded_for',
  'paid_at',
  'night',
  'stay_date',
]);

function isDecimal(value: object): value is { toNumber(): number } {
  return value instanceof Prisma.Decimal;
}

/**
 * Приводит ответ Prisma к JSON в том виде, в каком его ждёт фронтенд:
 * date → "YYYY-MM-DD", timestamptz → ISO, Decimal и BigInt → number.
 */
export function serialize(value: unknown, key?: string): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === 'bigint') return Number(value);
  if (value instanceof Date)
    return key && DATE_ONLY.has(key)
      ? value.toISOString().slice(0, 10)
      : value.toISOString();
  if (Array.isArray(value)) return value.map((v) => serialize(v));
  if (typeof value === 'object') {
    if (isDecimal(value)) return value.toNumber();
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = serialize(v, k);
    return out;
  }
  return value;
}
