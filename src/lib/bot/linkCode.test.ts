import { describe, expect, it } from "vitest";
import { generateLinkCode, normalizeLinkCode } from "./linkCode";

describe("код привязки", () => {
  it("8 символов без похожих букв и цифр, каждый раз новый", () => {
    const codes = new Set(Array.from({ length: 200 }, generateLinkCode));
    expect(codes.size).toBe(200);
    for (const code of codes) expect(code).toMatch(/^[A-HJKMNP-Z2-9]{8}$/);
  });

  it("нормализует ввод владельца", () => {
    expect(normalizeLinkCode(" ab3d ef7h ")).toBe("AB3DEF7H");
    expect(normalizeLinkCode("abc")).toBeNull();
    expect(normalizeLinkCode("код-123456")).toBeNull();
  });
});
