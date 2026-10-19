import { describe, expect, it } from "vitest";
import { holidayStay, isHolidayNight, upcomingHolidays } from "./holidays";

const almatyNoon = (date: string) => new Date(`${date}T07:00:00Z`);

describe("праздники", () => {
  it("праздничные ночи — накануне выходных дней", () => {
    expect(isHolidayNight("2026-12-31")).toBe(true);
    expect(isHolidayNight("2027-01-02")).toBe(true);
    expect(isHolidayNight("2027-01-03")).toBe(false);
    expect(isHolidayNight("2026-12-30")).toBe(false);
    expect(isHolidayNight("2026-12-15")).toBe(true);
  });

  it("поиск: заезд накануне, выезд в последний выходной", () => {
    expect(
      holidayStay({ id: "new_year", from: "2027-01-01", to: "2027-01-03" }),
    ).toEqual({ checkIn: "2026-12-31", checkOut: "2027-01-03" });
  });

  it("ближайшие два праздника", () => {
    expect(upcomingHolidays(almatyNoon("2026-10-19")).map((h) => h.id)).toEqual(
      ["independence", "new_year"],
    );
    // 16 декабря заезд (15-го) уже прошёл.
    expect(upcomingHolidays(almatyNoon("2026-12-16")).map((h) => h.id)).toEqual(
      ["new_year", "march8"],
    );
  });
});
