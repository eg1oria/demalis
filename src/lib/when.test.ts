import { describe, expect, it } from "vitest";
import { formatStay, resolveWhen } from "./when";

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

describe("formatStay", () => {
  it("по-русски и по-казахски", () => {
    const stay = resolveWhen("this", almatyNoon("2026-09-30"));
    expect(formatStay(stay, "ru")).toBe("2–4 окт.");
    expect(formatStay(stay, "kk")).toBe("2–4 қаз.");
  });
});
