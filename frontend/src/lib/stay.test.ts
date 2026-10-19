import { describe, expect, it } from "vitest";
import {
  indexNights,
  type NightsResponse,
  type PricedPlace,
  stayEstimate,
  stayStatus,
} from "./stay";

const now = new Date("2026-10-20T07:00:00Z");
const fresh = "2026-10-19T10:00:00Z";
const FRI = "2026-10-23";
const SAT = "2026-10-24";

function index(partial: Partial<NightsResponse>) {
  return indexNights(
    { rows: [], unitRows: [], freshness: [], ...partial },
    now,
  );
}

const row = (
  place_id: string,
  date: string,
  status: "free" | "limited" | "full",
  extra: { price?: number; free_capacity?: number } = {},
) => ({
  place_id,
  date,
  status,
  price: extra.price ?? null,
  free_capacity: extra.free_capacity ?? null,
});

describe("статус на выходные — обе ночи", () => {
  const idx = index({
    rows: [
      row("a", FRI, "free"),
      row("a", SAT, "free"),
      row("b", FRI, "full"),
      row("b", SAT, "free"),
      row("c", SAT, "free"),
    ],
    freshness: ["a", "b", "c"].map((place_id) => ({
      place_id,
      last_updated_at: fresh,
    })),
  });

  it("свободно обе ночи", () => {
    expect(stayStatus(idx, "a", [FRI, SAT])).toBe("free");
  });

  it("пятница занята — занято", () => {
    expect(stayStatus(idx, "b", [FRI, SAT])).toBe("full");
    expect(stayStatus(idx, "b", [SAT])).toBe("free");
  });

  it("пятница не отмечена — уточняйте", () => {
    expect(stayStatus(idx, "c", [FRI, SAT])).toBe("unknown");
  });

  it("свободных мест в домиках меньше, чем гостей — занято", () => {
    const withUnits = index({
      rows: [
        row("d", FRI, "limited", { free_capacity: 6 }),
        row("d", SAT, "limited", { free_capacity: 4 }),
      ],
      freshness: [{ place_id: "d", last_updated_at: fresh }],
    });
    expect(stayStatus(withUnits, "d", [FRI, SAT], 4)).toBe("limited");
    expect(stayStatus(withUnits, "d", [FRI, SAT], 5)).toBe("full");
  });
});

const prices = { price_from: 40000, price_weekend: 50000, price_holiday: null };

describe("примерная цена", () => {
  it("объект без домиков: будни + выходные + цена владельца на ночь", () => {
    const place: PricedPlace = {
      id: "a",
      ...prices,
      price_weekday: 30000,
      price_unit: "per_night_unit",
      units: [],
    };
    const idx = index({ rows: [row("a", SAT, "free", { price: 70000 })] });
    expect(stayEstimate(place, idx, ["2026-10-22", FRI, SAT])?.total).toBe(
      30000 + 50000 + 70000,
    );
  });

  it("с домиками — самый дешёвый свободный, куда помещаются гости", () => {
    const place: PricedPlace = {
      id: "p",
      ...prices,
      price_weekday: null,
      price_unit: "per_night_unit",
      units: [
        {
          id: "small",
          capacity: 2,
          ...prices,
          price_weekday: null,
          price_weekend: 30000,
        },
        {
          id: "big",
          capacity: 6,
          ...prices,
          price_weekday: null,
          price_weekend: 80000,
        },
        {
          id: "mid",
          capacity: 4,
          ...prices,
          price_weekday: null,
          price_weekend: 60000,
        },
      ],
    };
    const idx = index({
      unitRows: [{ unit_id: "mid", date: SAT, status: "full", price: null }],
    });
    expect(stayEstimate(place, idx, [FRI, SAT], 2)).toMatchObject({
      total: 60000,
      nights: 2,
      firstNight: FRI,
    });
    // На четверых: средний занят в сб — остаётся большой.
    expect(stayEstimate(place, idx, [FRI, SAT], 4)?.total).toBe(160000);
    expect(stayEstimate(place, idx, [FRI, SAT], 7)).toBeNull();
  });
});
