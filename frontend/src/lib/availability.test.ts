import { describe, expect, it } from "vitest";
import {
  byNightStatus,
  combineStatuses,
  daysSince,
  displayStatus,
  isAvailable,
  isStale,
} from "./availability";

const now = new Date("2026-10-01T07:00:00Z");
const daysAgo = (n: number) =>
  new Date(now.getTime() - n * 24 * 3600 * 1000).toISOString();

describe("displayStatus — пять состояний", () => {
  it("свободно", () => {
    expect(displayStatus("free", daysAgo(1), now)).toBe("free");
  });

  it("мало мест", () => {
    expect(displayStatus("limited", daysAgo(3), now)).toBe("limited");
  });

  it("занято", () => {
    expect(displayStatus("full", daysAgo(0), now)).toBe("full");
  });

  it("устарело — больше 7 дней без обновления, даже если было «свободно»", () => {
    expect(displayStatus("free", daysAgo(8), now)).toBe("stale");
    expect(displayStatus("full", daysAgo(30), now)).toBe("stale");
  });

  it("неизвестно — владелец не отмечал дату", () => {
    expect(displayStatus(null, daysAgo(1), now)).toBe("unknown");
    expect(displayStatus(undefined, null, now)).toBe("unknown");
  });
});

describe("граница в 7 дней", () => {
  it("ровно 7 дней — ещё свежие, 7 дней и минута — уже устарели", () => {
    expect(isStale(daysAgo(7), now)).toBe(false);
    expect(
      isStale(
        new Date(now.getTime() - 7 * 24 * 3600 * 1000 - 60_000).toISOString(),
        now,
      ),
    ).toBe(true);
  });

  it("нет даты обновления — устарело", () => {
    expect(isStale(null, now)).toBe(true);
  });
});

describe("isAvailable — «Свободно на выходные»", () => {
  it("только свободно и мало мест", () => {
    expect(
      ["free", "limited", "full", "stale", "unknown"].map((s) =>
        isAvailable(s as never),
      ),
    ).toEqual([true, true, false, false, false]);
  });
});

describe("хелперы", () => {
  it("несколько ночей — худший статус", () => {
    expect(combineStatuses(["free", "free"])).toBe("free");
    expect(combineStatuses(["free", "limited"])).toBe("limited");
    expect(combineStatuses(["limited", "unknown"])).toBe("unknown");
    expect(combineStatuses(["unknown", "full", "free"])).toBe("full");
    expect(combineStatuses(["stale", "free"])).toBe("stale");
    expect(combineStatuses([])).toBe("unknown");
  });

  it("дней с обновления", () => {
    expect(daysSince(daysAgo(0), now)).toBe(0);
    expect(daysSince(daysAgo(2.5), now)).toBe(2);
  });
});

describe("byNightStatus", () => {
  it("свободно → мало мест → уточняйте → занято, порядок внутри сохраняется", () => {
    const places = [
      { id: "a", status: "full" as const },
      { id: "b", status: "unknown" as const },
      { id: "c", status: "free" as const },
      { id: "d", status: "limited" as const },
      { id: "e", status: "stale" as const },
      { id: "f", status: "free" as const },
    ];
    expect(byNightStatus(places).map((p) => p.id)).toEqual([
      "c",
      "f",
      "d",
      "b",
      "e",
      "a",
    ]);
  });
});
