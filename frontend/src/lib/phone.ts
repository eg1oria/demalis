/**
 * Приводит казахстанский номер к виду +77XXXXXXXXX.
 * Понимает пробелы, скобки, дефисы и запись через 8 («8 701 123 45 67»).
 * Возвращает null, если номер не казахстанский или неполный.
 */
export function normalizeKzPhone(input: string): string | null {
  const digits = input.replace(/[\s()\-.]/g, "");
  if (!/^\+?\d+$/.test(digits)) return null;

  let normalized: string;
  if (digits.startsWith("+7")) normalized = digits;
  else if (digits.startsWith("8") && digits.length === 11)
    normalized = `+7${digits.slice(1)}`;
  else if (digits.startsWith("7") && digits.length === 11)
    normalized = `+${digits}`;
  else return null;

  return /^\+77\d{9}$/.test(normalized) ? normalized : null;
}
