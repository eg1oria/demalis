import { describe, expect, it } from "vitest";
import { validateGroupRequest } from "./validate";

const TODAY = "2026-10-19";
const base = {
  name: "  Айгерим   Сапарова ",
  phone: "8 701 123 45 67",
  occasion: "corporate",
  guests: "40",
  consent: "on",
};

describe("validateGroupRequest", () => {
  it("минимальная заявка без дат и бюджета", () => {
    expect(validateGroupRequest(base, TODAY)).toEqual({
      ok: true,
      data: {
        name: "Айгерим Сапарова",
        phone: "+77011234567",
        occasion: "corporate",
        guests: 40,
        date_from: null,
        date_to: null,
        budget: null,
        direction: null,
        amenities: [],
        comment: null,
      },
    });
  });

  it("полная заявка", () => {
    const result = validateGroupRequest(
      {
        ...base,
        dateFrom: "2026-12-26",
        dateTo: "2026-12-28",
        budget: "1 500 000 ₸",
        direction: "talgar",
        amenities: "has_banya,has_pool,has_banya",
        comment: " Нужен зал на 40 человек ",
      },
      TODAY,
    );
    expect(result).toMatchObject({
      ok: true,
      data: {
        date_from: "2026-12-26",
        date_to: "2026-12-28",
        budget: 1_500_000,
        direction: "talgar",
        amenities: ["has_banya", "has_pool"],
        comment: "Нужен зал на 40 человек",
      },
    });
  });

  it("меньше 15 и больше 500 гостей — ошибка", () => {
    expect(validateGroupRequest({ ...base, guests: "10" }, TODAY)).toEqual({
      ok: false,
      errors: { guests: "tooFew" },
    });
    expect(validateGroupRequest({ ...base, guests: "501" }, TODAY)).toEqual({
      ok: false,
      errors: { guests: "tooMany" },
    });
    expect(validateGroupRequest({ ...base, guests: "" }, TODAY)).toEqual({
      ok: false,
      errors: { guests: "required" },
    });
  });

  it("одна дата без второй и даты в прошлом", () => {
    expect(
      validateGroupRequest({ ...base, dateFrom: "2026-12-26" }, TODAY),
    ).toEqual({ ok: false, errors: { dateTo: "required" } });
    expect(
      validateGroupRequest(
        { ...base, dateFrom: "2026-10-01", dateTo: "2026-10-02" },
        TODAY,
      ),
    ).toEqual({ ok: false, errors: { dateFrom: "past" } });
  });

  it("свойства прототипа — не повод, не направление и не удобство", () => {
    const r = validateGroupRequest(
      {
        ...base,
        occasion: "constructor",
        direction: "toString",
        amenities: "has_chan,__proto__",
      },
      TODAY,
    );
    expect(!r.ok && r.errors).toEqual({
      occasion: "required",
      direction: "invalid",
      amenities: "invalid",
    });
  });

  it("собирает все ошибки сразу", () => {
    const result = validateGroupRequest(
      {
        occasion: "party",
        guests: "abc",
        budget: "-5",
        direction: "mars",
        amenities: "has_helipad",
      },
      TODAY,
    );
    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(Object.keys(result.errors).sort()).toEqual(
        [
          "amenities",
          "budget",
          "consent",
          "direction",
          "guests",
          "name",
          "occasion",
          "phone",
        ].sort(),
      );
  });
});
