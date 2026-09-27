import { describe, expect, it } from "vitest";
import {
  catalogHref,
  countActiveFilters,
  EMPTY_FILTERS,
  PAGE_SIZE,
  parseFilters,
  toggleAmenity,
  toSearchParams,
} from "./filters";

describe("parseFilters", () => {
  it("пустой адрес — фильтры по умолчанию", () => {
    expect(parseFilters({})).toEqual(EMPTY_FILTERS);
  });

  it("разбирает все фильтры", () => {
    expect(
      parseFilters(
        new URLSearchParams(
          "chan=1&banya=1&drive=60&guests=6&price=60&type=glamping&dir=talgar&sort=price&when=this&n=24",
        ),
      ),
    ).toEqual({
      when: "this",
      amenities: ["chan", "banya"],
      drive: 60,
      guests: 6,
      price: "60",
      type: "glamping",
      dir: "talgar",
      sort: "price",
      limit: 24,
    });
  });

  it("игнорирует мусор", () => {
    expect(
      parseFilters({
        chan: "yes",
        drive: "45",
        guests: "-3",
        price: "dorogo",
        type: "palace",
        dir: "moscow",
        sort: "random",
        when: "tomorrow",
        n: "100000",
      }),
    ).toEqual(EMPTY_FILTERS);
  });

  it("понимает конкретную дату и массивы из Next.js searchParams", () => {
    expect(
      parseFilters({ when: "2026-10-03", guests: ["4", "8"] }),
    ).toMatchObject({
      when: "2026-10-03",
      guests: 4,
    });
  });
});

describe("toSearchParams", () => {
  it("туда и обратно — без потерь", () => {
    const query =
      "when=next&chan=1&pets=1&drive=30&guests=10&price=100plus&type=house&dir=kapshagay&sort=near&n=36";
    const filters = parseFilters(new URLSearchParams(query));
    expect(parseFilters(toSearchParams(filters))).toEqual(filters);
  });

  it("не пишет значения по умолчанию", () => {
    expect(toSearchParams(EMPTY_FILTERS).toString()).toBe("");
  });

  it("фильтр «чан + до 1 ч + 6 гостей» — короткая ссылка", () => {
    expect(catalogHref({ amenities: ["chan"], drive: 60, guests: 6 })).toBe(
      "/catalog?chan=1&drive=60&guests=6",
    );
  });
});

describe("хелперы", () => {
  it("считает включённые фильтры (без сортировки и дат)", () => {
    expect(
      countActiveFilters(
        parseFilters({
          chan: "1",
          pool: "1",
          drive: "60",
          sort: "price",
          when: "this",
        }),
      ),
    ).toBe(3);
  });

  it("переключение удобства сбрасывает «Показать ещё»", () => {
    const filters = { ...EMPTY_FILTERS, limit: PAGE_SIZE * 3 };
    const on = toggleAmenity(filters, "chan");
    expect(on).toMatchObject({ amenities: ["chan"], limit: PAGE_SIZE });
    expect(toggleAmenity(on, "chan").amenities).toEqual([]);
  });
});
