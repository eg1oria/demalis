import { describe, expect, it } from "vitest";
import {
  almatyMidnight,
  isIsoDate,
  monthRange,
  parseMonth,
  shiftMonth,
} from "./dates";
import { formatDayMonth } from "./format";

describe("месяцы для отчётов", () => {
  const now = new Date("2026-10-31T20:00:00Z"); // в Алматы уже 1 ноября

  it("месяц из адреса или текущий по Алматы", () => {
    expect(parseMonth("2026-09", now)).toBe("2026-09");
    expect(parseMonth("2026-13", now)).toBe("2026-11");
    expect(parseMonth(undefined, now)).toBe("2026-11");
    expect(parseMonth(["2026-09"], now)).toBe("2026-11");
  });

  it("сдвиг через год", () => {
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
  });

  it("полночь по Алматы (UTC+5) и границы месяца", () => {
    expect(almatyMidnight("2026-10-01").toISOString()).toBe(
      "2026-09-30T19:00:00.000Z",
    );
    const { from, to } = monthRange("2026-12");
    expect(from.toISOString()).toBe("2026-11-30T19:00:00.000Z");
    expect(to.toISOString()).toBe("2026-12-31T19:00:00.000Z");
  });
});

describe("isIsoDate", () => {
  it("только настоящие даты YYYY-MM-DD", () => {
    expect(isIsoDate("2026-12-31")).toBe(true);
    expect(isIsoDate("2026-02-30")).toBe(false);
    expect(isIsoDate("2026-12-31T00:00")).toBe(false);
    expect(isIsoDate("")).toBe(false);
    expect(isIsoDate(20261231)).toBe(false);
  });

  it("«31.12» для подписи цены ночи", () => {
    expect(formatDayMonth("2026-12-31")).toBe("31.12");
  });
});
