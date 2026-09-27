import { describe, expect, it } from "vitest";
import { normalizeKzPhone } from "./phone";

describe("normalizeKzPhone", () => {
  it.each([
    ["+77011234567", "+77011234567"],
    ["+7 701 123 45 67", "+77011234567"],
    ["+7 (701) 123-45-67", "+77011234567"],
    ["87011234567", "+77011234567"],
    ["8 727 250 00 00", "+77272500000"],
    ["77011234567", "+77011234567"],
  ])("%s → %s", (input, expected) => {
    expect(normalizeKzPhone(input)).toBe(expected);
  });

  it.each([
    ["российский номер", "+79161234567"],
    ["короткий", "+7701123456"],
    ["длинный", "+770112345678"],
    ["буквы", "+7701abc4567"],
    ["пусто", ""],
    ["без кода страны", "7011234567"],
  ])("отклоняет: %s", (_, input) => {
    expect(normalizeKzPhone(input)).toBeNull();
  });
});
