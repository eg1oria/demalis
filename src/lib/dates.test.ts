import { describe, expect, it } from "vitest";
import { almatyMidnight, monthRange, parseMonth, shiftMonth } from "./dates";

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
