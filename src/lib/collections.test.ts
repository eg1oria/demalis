import { describe, expect, it } from "vitest";
import {
  collectionIntro,
  collectionTitle,
  normalizeCollectionFilters,
} from "./collections";

describe("normalizeCollectionFilters", () => {
  it.each([
    ["chan=1", "chan=1"],
    ["drive=60&chan=1", "chan=1&drive=60"],
    ["?pets=1", "pets=1"],
    ["https://site.kz/ru/catalog?type=glamping&n=24&view=map", "type=glamping"],
    ["when=this&all=1&guests=10", "guests=10"],
    ["price=30&sort=price", "price=30&sort=price"],
    ["chan=2&drive=45&type=castle", ""],
    ["", ""],
  ])("%s → «%s»", (input, expected) => {
    expect(normalizeCollectionFilters(input)).toBe(expected);
  });
});

describe("перевод подборки", () => {
  const c = {
    title_ru: "С чаном",
    title_kk: "Шаны бар",
    intro_ru: "Текст",
    intro_kk: " ",
  };
  it("казахский, если заполнен, иначе русский", () => {
    expect(collectionTitle(c, "kk")).toBe("Шаны бар");
    expect(collectionTitle(c, "ru")).toBe("С чаном");
    expect(collectionIntro(c, "kk")).toBe("Текст");
    expect(
      collectionIntro({ intro_ru: null, intro_kk: null }, "ru"),
    ).toBeNull();
  });
});
