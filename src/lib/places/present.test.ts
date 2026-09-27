import { describe, expect, it } from "vitest";
import {
  landscapeVariant,
  placeAmenities,
  placeDescription,
  placeName,
  visiblePhotos,
  whatsappUrl,
} from "./present";

describe("перевод полей объекта", () => {
  it("пустое казахское название → русское", () => {
    expect(placeName({ name_ru: "Дом", name_kk: null }, "kk")).toBe("Дом");
    expect(placeName({ name_ru: "Дом", name_kk: "  " }, "kk")).toBe("Дом");
    expect(placeName({ name_ru: "Дом", name_kk: "Үй" }, "kk")).toBe("Үй");
    expect(placeName({ name_ru: "Дом", name_kk: "Үй" }, "ru")).toBe("Дом");
  });

  it("пустое казахское описание → русское", () => {
    expect(
      placeDescription(
        { description_ru: "Описание", description_kk: "" },
        "kk",
      ),
    ).toBe("Описание");
    expect(
      placeDescription({ description_ru: null, description_kk: null }, "ru"),
    ).toBeNull();
  });
});

describe("visiblePhotos", () => {
  it("без разрешения — пусто", () => {
    expect(
      visiblePhotos({ photos: ["a.jpg"], photos_permission: false }),
    ).toEqual([]);
    expect(
      visiblePhotos({ photos: ["a.jpg"], photos_permission: true }),
    ).toEqual(["a.jpg"]);
  });
});

describe("placeAmenities", () => {
  const none = {
    has_banya: false,
    has_chan: false,
    has_pool: false,
    pets_allowed: false,
    has_kitchen: false,
    has_bbq: false,
    winter_ok: false,
    has_wifi: false,
  };

  it("3 главных по важности", () => {
    expect(
      placeAmenities(
        {
          ...none,
          has_wifi: true,
          has_chan: true,
          has_kitchen: true,
          pets_allowed: true,
        },
        3,
      ),
    ).toEqual(["has_chan", "pets_allowed", "has_kitchen"]);
  });
});

describe("whatsappUrl", () => {
  it("номер без плюса и закодированный текст", () => {
    expect(whatsappUrl("+77011234567", "Здравствуйте! 4 гостя")).toBe(
      "https://wa.me/77011234567?text=%D0%97%D0%B4%D1%80%D0%B0%D0%B2%D1%81%D1%82%D0%B2%D1%83%D0%B9%D1%82%D0%B5!%204%20%D0%B3%D0%BE%D1%81%D1%82%D1%8F",
    );
  });
});

describe("landscapeVariant", () => {
  it("стабилен и в диапазоне", () => {
    const v = landscapeVariant("9c3fc9d6-b03e-4521-a403-5a67db7e65ec", 4);
    expect(v).toBe(landscapeVariant("9c3fc9d6-b03e-4521-a403-5a67db7e65ec", 4));
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThan(4);
  });
});
