import { describe, expect, it } from "vitest";
import { goHref, parseGoParams } from "./go";

const ID = "3f1c2a54-9b1e-4c4e-8f1d-2a0b7c9d1e2f";

describe("goHref", () => {
  it("без параметров", () => {
    expect(goHref("instagram", ID)).toBe(`/api/go/instagram/${ID}`);
  });
  it("даты, гости и язык (русский — по умолчанию, не пишем)", () => {
    const dates = { checkIn: "2026-10-02", checkOut: "2026-10-04" };
    expect(goHref("whatsapp", ID, { dates, guests: 4, locale: "kk" })).toBe(
      `/api/go/whatsapp/${ID}?dates=2026-10-02_2026-10-04&guests=4&lang=kk`,
    );
    expect(goHref("whatsapp", ID, { dates, locale: "ru" })).toBe(
      `/api/go/whatsapp/${ID}?dates=2026-10-02_2026-10-04`,
    );
  });
});

describe("parseGoParams", () => {
  const parse = (query: string) => parseGoParams(new URLSearchParams(query));

  it("читает то, что собрал goHref", () => {
    expect(parse("dates=2026-10-02_2026-10-04&guests=4&lang=kk")).toEqual({
      dates: { checkIn: "2026-10-02", checkOut: "2026-10-04" },
      guests: 4,
      locale: "kk",
    });
  });

  it("мусор → значения по умолчанию", () => {
    const empty = { dates: null, guests: null, locale: "ru" };
    expect(parse("")).toEqual(empty);
    expect(parse("dates=2026-10-04_2026-10-02&guests=0&lang=en")).toEqual(
      empty,
    );
    expect(parse("dates=2026-02-30_2026-03-01&guests=31")).toEqual(empty);
    expect(parse("dates=abc&guests=2.5")).toEqual(empty);
  });
});
