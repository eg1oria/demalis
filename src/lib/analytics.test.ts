import { describe, expect, it } from "vitest";
import { gtagCalls } from "./analytics";

describe("gtagCalls", () => {
  const ads = { adsId: "AW-123", labels: { generate_lead: "AbC" } };

  it("событие GA4 + конверсия Ads, если есть метка", () => {
    expect(gtagCalls("generate_lead", { place_id: "p1" }, ads)).toEqual([
      ["event", "generate_lead", { place_id: "p1" }],
      ["event", "conversion", { send_to: "AW-123/AbC" }],
    ]);
  });

  it("без метки — только событие GA4", () => {
    expect(gtagCalls("click_call", {}, ads)).toEqual([
      ["event", "click_call", {}],
    ]);
  });

  it("без номера тега Ads — только событие GA4", () => {
    expect(
      gtagCalls("generate_lead", {}, { labels: { generate_lead: "AbC" } }),
    ).toHaveLength(1);
  });
});
