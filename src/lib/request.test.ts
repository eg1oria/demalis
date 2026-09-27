import { describe, expect, it } from "vitest";
import { clientIp, isBot, rateLimitKey } from "./request";

describe("clientIp", () => {
  it("первый адрес из x-forwarded-for", () => {
    const h = new Headers({ "x-forwarded-for": " 1.2.3.4 , 10.0.0.1" });
    expect(clientIp(h)).toBe("1.2.3.4");
  });
  it("x-real-ip, если нет x-forwarded-for", () => {
    expect(clientIp(new Headers({ "x-real-ip": "5.6.7.8" }))).toBe("5.6.7.8");
  });
  it("без заголовков — общий ключ", () => {
    expect(clientIp(new Headers())).toBe("unknown");
  });
});

describe("rateLimitKey", () => {
  it("хэш без IP в открытом виде, зависит от секрета", () => {
    const key = rateLimitKey("1.2.3.4", "secret");
    expect(key).toMatch(/^[0-9a-f]{64}$/);
    expect(key).not.toContain("1.2.3.4");
    expect(rateLimitKey("1.2.3.4", "secret")).toBe(key);
    expect(rateLimitKey("1.2.3.4", "other")).not.toBe(key);
    expect(rateLimitKey("1.2.3.5", "secret")).not.toBe(key);
  });
});

describe("isBot", () => {
  it.each([
    [null, true],
    ["Mozilla/5.0 (compatible; Googlebot/2.1)", true],
    ["Mozilla/5.0 (compatible; YandexBot/3.0)", true],
    ["WhatsApp/2.23.20.0", true],
    ["TelegramBot (like TwitterBot)", true],
    [
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1",
      false,
    ],
    [
      "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/126.0 Mobile Safari/537.36",
      false,
    ],
    [
      "Mozilla/5.0 (Linux; Android 14; wv) AppleWebKit/537.36 Chrome/126.0 Mobile Safari/537.36 Telegram-Android/11.2.3",
      false,
    ],
  ])("%s → %s", (ua, expected) => {
    expect(isBot(ua)).toBe(expected);
  });
});
