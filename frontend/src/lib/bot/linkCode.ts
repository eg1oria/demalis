import { randomInt } from "node:crypto";

// Без похожих символов (0/O, 1/I/L): код диктуют по телефону.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const LINK_CODE_LENGTH = 8;

/** Одноразовый код привязки бота (31^8 ≈ 850 млрд вариантов). */
export function generateLinkCode(): string {
  return Array.from(
    { length: LINK_CODE_LENGTH },
    () => ALPHABET[randomInt(ALPHABET.length)],
  ).join("");
}

/** Код из «/start код»: регистр и пробелы не важны. */
export function normalizeLinkCode(input: string): string | null {
  const code = input.replace(/\s+/g, "").toUpperCase();
  return /^[A-Z0-9]{6,16}$/.test(code) ? code : null;
}
