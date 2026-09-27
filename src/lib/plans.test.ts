import { describe, expect, it } from "vitest";
import {
  effectivePlan,
  isFeatured,
  planFeatures,
  promote,
  proReminderDue,
} from "./plans";

const TODAY = "2026-10-05";

describe("effectivePlan", () => {
  it.each([
    [{ plan: "free", pro_until: null }, "free"],
    [{ plan: "free", pro_until: "2026-12-31" }, "free"],
    [{ plan: "pro", pro_until: null }, "pro"],
    [{ plan: "pro", pro_until: "2026-10-05" }, "pro"],
    [{ plan: "pro", pro_until: "2026-10-04" }, "free"],
  ] as const)("%o → %s", (place, expected) => {
    expect(effectivePlan(place, TODAY)).toBe(expected);
  });

  it("возможности тарифа из конфига", () => {
    expect(
      planFeatures({ plan: "free", pro_until: null }, TODAY),
    ).toMatchObject({
      photos: 5,
      video: false,
      availability: false,
      verified: false,
    });
    expect(planFeatures({ plan: "pro", pro_until: null }, TODAY)).toMatchObject(
      {
        photos: 20,
        video: true,
        availability: true,
        verified: true,
      },
    );
  });
});

describe("продвижение", () => {
  const place = (id: string, featured_until: string | null) => ({
    id,
    featured_until,
  });

  it("действует по дату включительно", () => {
    expect(isFeatured(place("a", TODAY), TODAY)).toBe(true);
    expect(isFeatured(place("a", "2026-10-04"), TODAY)).toBe(false);
    expect(isFeatured(place("a", null), TODAY)).toBe(false);
  });

  it("не больше двух наверху, остальные на своих местах", () => {
    const list = [
      place("a", null),
      place("b", "2026-10-10"),
      place("c", null),
      place("d", "2026-10-10"),
      place("e", "2026-10-10"),
      place("f", "2026-10-01"),
    ];
    const result = promote(list, TODAY);
    expect(result).toHaveLength(6);
    expect(result.filter((p) => p.promoted)).toHaveLength(2);
    expect(result[0].promoted && result[1].promoted).toBe(true);
    expect(["b", "d", "e"]).toContain(result[0].id);
    // Непродвинутые сохраняют порядок.
    const rest = result.slice(2).map((p) => p.id);
    expect(rest.filter((id) => ["a", "c", "f"].includes(id))).toEqual([
      "a",
      "c",
      "f",
    ]);
    // Истёкшее продвижение наверх не попадает.
    expect(result.slice(0, 2).map((p) => p.id)).not.toContain("f");
  });

  it("порядок продвигаемых меняется по дням, но стабилен в течение дня", () => {
    const list = ["p1", "p2", "p3", "p4", "p5", "p6"].map((id) =>
      place(id, "2026-12-31"),
    );
    const tops = new Set<string>();
    for (let d = 1; d <= 20; d++) {
      const day = `2026-11-${String(d).padStart(2, "0")}`;
      const top = promote(list, day)
        .slice(0, 2)
        .map((p) => p.id)
        .join();
      expect(
        promote(list, day)
          .slice(0, 2)
          .map((p) => p.id)
          .join(),
      ).toBe(top);
      tops.add(top);
    }
    expect(tops.size).toBeGreaterThan(1);
  });

  it("без продвигаемых — порядок не меняется", () => {
    const list = [place("a", null), place("b", null)];
    expect(promote(list, TODAY)).toEqual(list);
  });
});

describe("proReminderDue", () => {
  const pro = (
    pro_until: string | null,
    pro_reminded_for: string | null = null,
  ) => ({
    plan: "pro" as const,
    pro_until,
    pro_reminded_for,
  });

  it("за 5 дней и ближе, один раз на дату окончания", () => {
    expect(proReminderDue(pro("2026-10-10"), TODAY)).toBe(true);
    expect(proReminderDue(pro("2026-10-05"), TODAY)).toBe(true);
    expect(proReminderDue(pro("2026-10-11"), TODAY)).toBe(false);
    expect(proReminderDue(pro("2026-10-04"), TODAY)).toBe(false);
    expect(proReminderDue(pro("2026-10-10", "2026-10-10"), TODAY)).toBe(false);
    // Продлили Pro — по новой дате напомним снова.
    expect(proReminderDue(pro("2026-10-08", "2026-09-08"), TODAY)).toBe(true);
    expect(proReminderDue(pro(null), TODAY)).toBe(false);
    expect(
      proReminderDue(
        { plan: "free", pro_until: "2026-10-08", pro_reminded_for: null },
        TODAY,
      ),
    ).toBe(false);
  });
});
