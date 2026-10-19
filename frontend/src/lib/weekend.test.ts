import { describe, expect, it } from "vitest";
import { getUpcomingWeekend } from "./weekend";

// Алматы — UTC+5, поэтому полдень по Алматы = 07:00 UTC.
const almatyNoon = (date: string) => new Date(`${date}T07:00:00Z`);

describe("getUpcomingWeekend", () => {
  describe("все дни недели (неделя 28.09–04.10.2026)", () => {
    it.each([
      ["понедельник", "2026-09-28"],
      ["вторник", "2026-09-29"],
      ["среда", "2026-09-30"],
      ["четверг", "2026-10-01"],
      ["пятница", "2026-10-02"],
    ])("%s → ближайшие пятница и суббота", (_, date) => {
      expect(getUpcomingWeekend(almatyNoon(date))).toEqual({
        nights: ["2026-10-02", "2026-10-03"],
        saturday: "2026-10-03",
      });
    });

    it("суббота → только сегодняшняя ночь", () => {
      expect(getUpcomingWeekend(almatyNoon("2026-10-03"))).toEqual({
        nights: ["2026-10-03"],
        saturday: "2026-10-03",
      });
    });

    it("воскресенье → следующие пятница и суббота", () => {
      expect(getUpcomingWeekend(almatyNoon("2026-10-04"))).toEqual({
        nights: ["2026-10-09", "2026-10-10"],
        saturday: "2026-10-10",
      });
    });
  });

  describe("переход через месяц и год", () => {
    it("воскресенье 27.09 → пятница 02.10 и суббота 03.10", () => {
      expect(getUpcomingWeekend(almatyNoon("2026-09-27")).nights).toEqual([
        "2026-10-02",
        "2026-10-03",
      ]);
    });

    it("пятница 30.04 → суббота уже 01.05", () => {
      expect(getUpcomingWeekend(almatyNoon("2027-04-30")).nights).toEqual([
        "2027-04-30",
        "2027-05-01",
      ]);
    });

    it("февраль невисокосного года: среда 25.02 → 27.02 и 28.02", () => {
      expect(getUpcomingWeekend(almatyNoon("2026-02-25")).nights).toEqual([
        "2026-02-27",
        "2026-02-28",
      ]);
    });

    it("понедельник 28.12 → 01.01 и 02.01 следующего года", () => {
      expect(getUpcomingWeekend(almatyNoon("2026-12-28")).nights).toEqual([
        "2027-01-01",
        "2027-01-02",
      ]);
    });
  });

  describe("часовой пояс Asia/Almaty", () => {
    it("пятница 23:30 по UTC — это уже суббота 04:30 в Алматы", () => {
      expect(getUpcomingWeekend(new Date("2026-10-02T23:30:00Z"))).toEqual({
        nights: ["2026-10-03"],
        saturday: "2026-10-03",
      });
    });

    it("суббота 23:59 по Алматы — ещё суббота", () => {
      expect(
        getUpcomingWeekend(new Date("2026-10-03T18:59:00Z")).nights,
      ).toEqual(["2026-10-03"]);
    });

    it("воскресенье 00:00 по Алматы (суббота 19:00 UTC) — уже следующие выходные", () => {
      expect(
        getUpcomingWeekend(new Date("2026-10-03T19:00:00Z")).nights,
      ).toEqual(["2026-10-09", "2026-10-10"]);
    });
  });
});
