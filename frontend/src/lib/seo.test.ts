import { describe, expect, it } from "vitest";
import {
  breadcrumbJsonLd,
  jsonLdString,
  languageAlternates,
  lodgingJsonLd,
  pageMetadata,
  truncate,
} from "./seo";

describe("hreflang и метаданные", () => {
  it("альтернативы для обоих языков и x-default", () => {
    expect(languageAlternates("/catalog")).toEqual({
      ru: "/ru/catalog",
      kk: "/kk/catalog",
      "x-default": "/ru/catalog",
    });
    expect(languageAlternates("")).toEqual({
      ru: "/ru",
      kk: "/kk",
      "x-default": "/ru",
    });
  });

  it("canonical на свой язык, Open Graph с фото и локалью", () => {
    const m = pageMetadata({
      locale: "kk",
      path: "/place/dom",
      title: "Үй",
      description: "Сипаттама",
      images: ["https://x/1.jpg"],
    });
    expect(m.alternates?.canonical).toBe("/kk/place/dom");
    expect(m.openGraph).toMatchObject({
      locale: "kk_KZ",
      url: "/kk/place/dom",
      images: ["https://x/1.jpg"],
    });
  });

  it("обрезает описание по слову", () => {
    expect(truncate("короткий текст", 160)).toBe("короткий текст");
    const long = "слово ".repeat(60);
    const cut = truncate(long, 160);
    expect(cut.length).toBeLessThanOrEqual(160);
    expect(cut.endsWith("слово…")).toBe(true);
  });
});

describe("JSON-LD", () => {
  it("экранирует «<», чтобы нельзя было закрыть <script>", () => {
    const s = jsonLdString({ name: "</script><script>alert(1)</script>" });
    expect(s).not.toContain("<");
    expect(JSON.parse(s).name).toBe("</script><script>alert(1)</script>");
  });

  it("BreadcrumbList", () => {
    expect(
      breadcrumbJsonLd([
        { name: "Главная", url: "https://x/ru" },
        { name: "Каталог", url: "https://x/ru/catalog" },
      ]),
    ).toEqual({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Главная",
          item: "https://x/ru",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Каталог",
          item: "https://x/ru/catalog",
        },
      ],
    });
  });

  it("LodgingBusiness: пустые поля не выводит", () => {
    const base = {
      name: "Дом",
      description: null,
      url: "https://x/ru/place/dom",
      images: [],
      address: null,
      locality: null,
      region: "Алматинская область",
      lat: null,
      lng: null,
      phone: "+77011234567",
      priceRange: null,
      amenities: [],
      petsAllowed: false,
    };
    const ld = lodgingJsonLd(base);
    expect(ld).toEqual({
      "@context": "https://schema.org",
      "@type": "LodgingBusiness",
      name: "Дом",
      url: "https://x/ru/place/dom",
      address: {
        "@type": "PostalAddress",
        addressRegion: "Алматинская область",
        addressCountry: "KZ",
      },
      telephone: "+77011234567",
      currenciesAccepted: "KZT",
      petsAllowed: false,
    });
    const full = lodgingJsonLd({
      ...base,
      images: ["https://x/1.jpg"],
      lat: 43.1,
      lng: 77.2,
      amenities: ["Чан"],
      priceRange: "от 42 000 ₸",
    });
    expect(full).toMatchObject({
      image: ["https://x/1.jpg"],
      geo: { "@type": "GeoCoordinates", latitude: 43.1, longitude: 77.2 },
      amenityFeature: [
        { "@type": "LocationFeatureSpecification", name: "Чан", value: true },
      ],
      priceRange: "от 42 000 ₸",
    });
  });
});
