import { describe, expect, it } from "vitest";
import { normalizeInstagram, validateOwnerRequest } from "./request";

describe("normalizeInstagram", () => {
  it.each([
    ["", null],
    ["  ", null],
    ["@arsha.aframe", "https://www.instagram.com/arsha.aframe/"],
    ["arsha_glamping", "https://www.instagram.com/arsha_glamping/"],
    ["instagram.com/arsha", "https://www.instagram.com/arsha/"],
    [
      "https://www.instagram.com/arsha/?igsh=abc",
      "https://www.instagram.com/arsha/",
    ],
    ["http://instagram.com/Arsha", "https://www.instagram.com/Arsha/"],
    ["https://evil.com/arsha", undefined],
    ["арша", undefined],
    ["@" + "a".repeat(31), undefined],
  ])("«%s» → %s", (input, expected) => {
    expect(normalizeInstagram(input)).toBe(expected);
  });
});

describe("validateOwnerRequest", () => {
  const valid = {
    name: "  Глэмпинг   «Арша» ",
    phone: "8 701 123 45 67",
    instagram: "@arsha",
    direction: "issyk_turgen",
    type: "glamping",
    consent: "on",
  };

  it("правильная заявка", () => {
    expect(validateOwnerRequest(valid)).toEqual({
      ok: true,
      data: {
        name: "Глэмпинг «Арша»",
        phone: "+77011234567",
        instagram_url: "https://www.instagram.com/arsha/",
        direction: "issyk_turgen",
        type: "glamping",
      },
    });
  });

  it("Instagram необязателен", () => {
    const r = validateOwnerRequest({ ...valid, instagram: "" });
    expect(r.ok && r.data.instagram_url).toBeNull();
  });

  it("пустая форма — все обязательные поля", () => {
    expect(validateOwnerRequest({})).toEqual({
      ok: false,
      errors: {
        name: "required",
        phone: "required",
        direction: "required",
        type: "required",
        consent: "required",
      },
    });
  });

  it("неверные значения", () => {
    expect(
      validateOwnerRequest({
        ...valid,
        name: "я".repeat(101),
        phone: "123",
        instagram: "https://vk.com/x",
        direction: "moon",
        type: "castle",
        consent: "yes",
      }),
    ).toEqual({
      ok: false,
      errors: {
        name: "tooLong",
        phone: "invalid",
        instagram: "invalid",
        direction: "required",
        type: "required",
        consent: "required",
      },
    });
  });
});
