import { describe, expect, it } from "vitest";
import { isWeekendNight, nightPrice, stayPrice } from "./stayPrice";

const place = {
  price_from: 40000,
  price_weekday: 35000,
  price_weekend: 50000,
  price_holiday: 90000,
};

describe("цена по дням", () => {
  it("пт и сб — выходные ночи", () => {
    expect(isWeekendNight("2026-10-23")).toBe(true); // пт
    expect(isWeekendNight("2026-10-24")).toBe(true); // сб
    expect(isWeekendNight("2026-10-25")).toBe(false); // вс
  });

  it("будни, выходные, праздник", () => {
    expect(nightPrice(place, "2026-10-21")).toBe(35000);
    expect(nightPrice(place, "2026-10-24")).toBe(50000);
    expect(nightPrice(place, "2026-12-31")).toBe(90000);
  });

  it("нет нужной цены — ближайшая по смыслу", () => {
    const onlyFrom = {
      price_from: 40000,
      price_weekday: null,
      price_weekend: null,
      price_holiday: null,
    };
    expect(nightPrice(onlyFrom, "2026-12-31")).toBe(40000);
    expect(
      nightPrice({ ...onlyFrom, price_weekend: 60000 }, "2026-12-31"),
    ).toBe(60000);
    expect(
      nightPrice(
        { price_weekday: 30000, price_weekend: null, price_holiday: null },
        "2026-10-24",
      ),
    ).toBe(30000);
  });

  it("за 2 ночи выходных", () => {
    expect(stayPrice(place, ["2026-10-23", "2026-10-24"])).toEqual({
      total: 100000,
      nights: 2,
      perPersonUnknownGuests: false,
    });
  });

  it("цена владельца на ночь важнее", () => {
    expect(
      stayPrice(place, ["2026-12-31"], new Map([["2026-12-31", 120000]]))
        ?.total,
    ).toBe(120000);
  });

  it("за человека: умножаем на гостей, без гостей — помечаем", () => {
    const perPerson = { ...place, price_unit: "per_person" as const };
    expect(stayPrice(perPerson, ["2026-10-21"], undefined, 3)?.total).toBe(
      105000,
    );
    expect(stayPrice(perPerson, ["2026-10-21"])?.perPersonUnknownGuests).toBe(
      true,
    );
  });

  it("без цен — null", () => {
    expect(
      stayPrice(
        { price_weekday: null, price_weekend: null, price_holiday: null },
        ["2026-10-21"],
      ),
    ).toBeNull();
    expect(stayPrice(place, [])).toBeNull();
  });
});
