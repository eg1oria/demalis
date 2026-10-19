import { describe, expect, it } from "vitest";
import { validatePlaceInput } from "./validate";

const base = {
  name_ru: "Дом у реки",
  type: "house",
  direction: "talgar",
  whatsapp_phone: "+7 701 123 45 67",
};

describe("validatePlaceInput", () => {
  it("минимальный набор полей проходит и получает значения по умолчанию", () => {
    const result = validatePlaceInput(base);
    expect(result).toMatchObject({
      ok: true,
      data: {
        slug: "dom-u-reki",
        whatsapp_phone: "+77011234567",
        status: "draft",
        plan: "free",
        price_unit: "per_night_unit",
        has_chan: false,
        photos_permission: false,
      },
    });
  });

  it("принимает русские подписи вместо ключей enum", () => {
    const result = validatePlaceInput({
      ...base,
      type: "Глэмпинг",
      direction: "капшагай",
      status: "Опубликован",
    });
    expect(result).toMatchObject({
      ok: true,
      data: { type: "glamping", direction: "kapshagay", status: "published" },
    });
  });

  it("понимает да/нет, 1/0 и чекбокс формы", () => {
    const result = validatePlaceInput({
      ...base,
      has_chan: "да",
      has_banya: "1",
      has_pool: "on",
      pets_allowed: "нет",
    });
    expect(result).toMatchObject({
      ok: true,
      data: {
        has_chan: true,
        has_banya: true,
        has_pool: true,
        pets_allowed: false,
      },
    });
  });

  it("числа с пробелами и координаты с запятой", () => {
    const result = validatePlaceInput({
      ...base,
      price_from: "35 000",
      lat: "43,2567",
      lng: "77.0123",
    });
    expect(result).toMatchObject({
      ok: true,
      data: { price_from: 35000, lat: 43.2567, lng: 77.0123 },
    });
  });

  it("@ник в Instagram превращается в ссылку", () => {
    const result = validatePlaceInput({
      ...base,
      instagram_url: "@dom.u.reki",
    });
    expect(result).toMatchObject({
      ok: true,
      data: { instagram_url: "https://www.instagram.com/dom.u.reki/" },
    });
  });

  it("неверный телефон — понятная ошибка", () => {
    const result = validatePlaceInput({ ...base, whatsapp_phone: "12345" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toEqual([
        {
          field: "whatsapp_phone",
          message:
            "Телефон WhatsApp: неверный номер «12345», нужен +77XXXXXXXXX",
        },
      ]);
    }
  });

  it("собирает все ошибки сразу", () => {
    const result = validatePlaceInput({
      type: "дворец",
      capacity_max: "0",
      has_chan: "может быть",
      video_url: "youtube",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.map((e) => e.field).sort()).toEqual(
        [
          "capacity_max",
          "direction",
          "has_chan",
          "name_ru",
          "type",
          "video_url",
          "whatsapp_phone",
        ].sort(),
      );
    }
  });

  it("slug из формы проверяется", () => {
    const result = validatePlaceInput({ ...base, slug: "Дом у реки" });
    expect(result.ok).toBe(false);
  });
});
