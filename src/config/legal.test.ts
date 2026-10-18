import { describe, expect, it } from "vitest";
import { fillLegal, isFilled, LEGAL, phoneDigits } from "./legal";

describe("isFilled", () => {
  it.each([
    ["[ЗАПОЛНИТЬ: email]", false],
    ["  ", false],
    ["", false],
    ["ИП Иванов Иван", true],
    ["+77011234567", true],
  ])("%s → %s", (value, expected) => {
    expect(isFilled(value)).toBe(expected);
  });
});

describe("fillLegal", () => {
  it("подставляет сайт и реквизиты", () => {
    expect(fillLegal("{site}: {operator}, {email}", "Демалыс")).toBe(
      `Демалыс: ${LEGAL.operator}, ${LEGAL.email}`,
    );
  });

  it("неизвестные подстановки оставляет как есть", () => {
    expect(fillLegal("{nope} и {bin}", "X")).toBe(`{nope} и ${LEGAL.bin}`);
  });
});

it("phoneDigits оставляет только цифры и +", () => {
  expect(phoneDigits("+7 (701) 123-45-67")).toBe("+77011234567");
});
