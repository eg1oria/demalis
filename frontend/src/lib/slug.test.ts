import { describe, expect, it } from "vitest";
import { isValidSlug, slugify, uniqueSlug } from "./slug";

describe("slugify", () => {
  it.each([
    ["Глэмпинг «Горный воздух»", "glemping-gornyy-vozdukh"],
    ["A-frame у озера", "a-frame-u-ozera"],
    ["Дом с баней и чаном №2", "dom-s-baney-i-chanom-2"],
    ["Щучье", "shchuche"],
    ["Көкжайлау үйі", "kokzhaylau-uyi"],
    ["Қоңыр Ғасыр", "konyr-gasyr"],
    ["  [ТЕСТ] Юрта  ", "test-yurta"],
    ["Café Élan", "cafe-elan"],
  ])("%s → %s", (input, expected) => {
    expect(slugify(input)).toBe(expected);
  });

  it("результат всегда валидный slug", () => {
    expect(isValidSlug(slugify("---Тест!!!---"))).toBe(true);
  });

  it("пустая строка для текста без букв и цифр", () => {
    expect(slugify("!!!")).toBe("");
  });

  it("обрезает до 80 символов без дефиса в конце", () => {
    const slug = slugify("очень ".repeat(30));
    expect(slug.length).toBeLessThanOrEqual(80);
    expect(slug.endsWith("-")).toBe(false);
  });
});

describe("uniqueSlug", () => {
  it("возвращает как есть, если свободен", () => {
    expect(uniqueSlug("dom", new Set())).toBe("dom");
  });

  it("добавляет номер, если занят", () => {
    expect(uniqueSlug("dom", new Set(["dom", "dom-2"]))).toBe("dom-3");
  });
});
