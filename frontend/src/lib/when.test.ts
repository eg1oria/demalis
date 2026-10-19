import { describe, expect, it } from "vitest";
import { formatStay, nightsOf, resolveWhen } from "./when";

const almatyNoon = (date: string) => new Date(`${date}T07:00:00Z`);

describe("resolveWhen", () => {
  it("эти выходные в среду — пт и сб, выезд в вс", () => {
    expect(resolveWhen("this", almatyNoon("2026-09-30"))).toEqual({
      nights: ["2026-10-02", "2026-10-03"],
      checkIn: "2026-10-02",
      checkOut: "2026-10-04",
    });
  });

  it("следующие выходные в среду — через неделю", () => {
    expect(resolveWhen("next", almatyNoon("2026-09-30")).nights).toEqual([
      "2026-10-09",
      "2026-10-10",
    ]);
  });

  it("в субботу: эти — только сегодня, следующие — пт и сб через неделю", () => {
    const saturday = almatyNoon("2026-10-03");
    expect(resolveWhen("this", saturday).nights).toEqual(["2026-10-03"]);
    expect(resolveWhen("next", saturday).nights).toEqual([
      "2026-10-09",
      "2026-10-10",
    ]);
  });

  it("конкретная дата — одна ночь", () => {
    expect(resolveWhen("2026-10-31", almatyNoon("2026-09-30"))).toEqual({
      nights: ["2026-10-31"],
      checkIn: "2026-10-31",
      checkOut: "2026-11-01",
    });
  });
});

describe("будни и диапазон", () => {
  it("будни в среду — следующие пн и вт, выезд в ср", () => {
    expect(resolveWhen("weekdays", almatyNoon("2026-09-30"))).toEqual({
      nights: ["2026-10-05", "2026-10-06"],
      checkIn: "2026-10-05",
      checkOut: "2026-10-07",
    });
  });

  it("будни в понедельник — с сегодняшнего", () => {
    expect(resolveWhen("weekdays", almatyNoon("2026-10-05")).checkIn).toBe(
      "2026-10-05",
    );
  });

  it("диапазон через Новый год", () => {
    expect(
      resolveWhen("2026-12-30_2027-01-02", almatyNoon("2026-10-01")),
    ).toEqual({
      nights: ["2026-12-30", "2026-12-31", "2027-01-01"],
      checkIn: "2026-12-30",
      checkOut: "2027-01-02",
    });
  });

  it("ночи между датами", () => {
    expect(nightsOf("2026-10-30", "2026-11-01")).toEqual([
      "2026-10-30",
      "2026-10-31",
    ]);
  });
});

describe("formatStay", () => {
  it("через Новый год — без годов", () => {
    expect(
      formatStay({ checkIn: "2026-12-31", checkOut: "2027-01-03" }, "ru"),
    ).toBe("31 дек. – 3 янв.");
  });

  it("по-русски и по-казахски", () => {
    const stay = resolveWhen("this", almatyNoon("2026-09-30"));
    expect(formatStay(stay, "ru")).toBe("2–4 окт.");
    expect(formatStay(stay, "kk")).toBe("2–4 қаз.");
  });
});
