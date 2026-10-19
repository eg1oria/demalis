import { describe, expect, it } from "vitest";
import { BOT_TEXTS, menuAction } from "./texts";

describe("тексты бота", () => {
  it("кнопки меню узнаются на обоих языках", () => {
    expect(menuAction(BOT_TEXTS.ru.menu.dates)).toBe("dates");
    expect(menuAction(BOT_TEXTS.kk.menu.weekendFull)).toBe("weekendFull");
    expect(menuAction(` ${BOT_TEXTS.kk.menu.stats} `)).toBe("stats");
    expect(menuAction("привет")).toBeNull();
  });

  it("кнопки меню на разных языках не совпадают", () => {
    const ru = Object.values(BOT_TEXTS.ru.menu);
    const kk = Object.values(BOT_TEXTS.kk.menu);
    expect(new Set(ru).size).toBe(ru.length);
    expect(new Set(kk).size).toBe(kk.length);
  });

  it("у обоих языков одинаковый набор текстов", () => {
    expect(Object.keys(BOT_TEXTS.kk).sort()).toEqual(
      Object.keys(BOT_TEXTS.ru).sort(),
    );
  });

  it("склонение «гость»", () => {
    const g = BOT_TEXTS.ru.guests;
    expect([1, 2, 5, 11, 12, 21, 22, 25].map(g)).toEqual([
      "1 гость",
      "2 гостя",
      "5 гостей",
      "11 гостей",
      "12 гостей",
      "21 гость",
      "22 гостя",
      "25 гостей",
    ]);
  });
});
