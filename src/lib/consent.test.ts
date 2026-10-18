import { describe, expect, it } from "vitest";
import {
  consentCookie,
  gtagConsent,
  parseConsent,
  trackingCookieNames,
} from "./consent";

describe("parseConsent", () => {
  it.each([
    ["consent=granted", "granted"],
    ["fav=a,b; consent=denied; x=1", "denied"],
    ["consent=maybe", null],
    ["myconsent=granted", null],
    ["", null],
    [null, null],
  ])("%s → %s", (cookies, expected) => {
    expect(parseConsent(cookies)).toBe(expected);
  });
});

it("consentCookie: 180 дней, Secure только по https", () => {
  expect(consentCookie("granted", false)).toBe(
    "consent=granted; Path=/; Max-Age=15552000; SameSite=Lax",
  );
  expect(consentCookie("denied", true)).toMatch(/; Secure$/);
});

it("gtagConsent: все четыре параметра Consent Mode v2", () => {
  expect(gtagConsent("denied")).toEqual({
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
  });
});

it("trackingCookieNames: только cookie Google и Метрики", () => {
  expect(
    trackingCookieNames(
      "_ga=1; _ga_ABC=2; _gcl_au=3; _ym_uid=4; fav=x; consent=denied; sb-auth=5",
    ),
  ).toEqual(["_ga", "_ga_ABC", "_gcl_au", "_ym_uid"]);
});
