/**
 * Согласие на cookie аналитики и рекламы (баннер внизу экрана).
 * Выбор хранится в cookie `consent`; до выбора всё «denied» —
 * Google Tag работает в Consent Mode без cookie, Яндекс Метрика не грузится.
 */
export const CONSENT_COOKIE = "consent";
export const CONSENT_MAX_AGE = 180 * 24 * 60 * 60;

/** Событие window: выбор сделан или изменён (detail — Consent). */
export const CONSENT_CHANGE_EVENT = "consent:change";
/** Событие window: открыть баннер снова («Настройки cookie» в подвале). */
export const CONSENT_OPEN_EVENT = "consent:open";

export type Consent = "granted" | "denied";

/** Значение из строки cookie (document.cookie или заголовок Cookie). */
export function parseConsent(
  cookies: string | null | undefined,
): Consent | null {
  const match = (cookies ?? "").match(
    /(?:^|;\s*)consent=(granted|denied)(?:;|$)/,
  );
  return (match?.[1] as Consent | undefined) ?? null;
}

export function consentCookie(value: Consent, secure: boolean): string {
  return `${CONSENT_COOKIE}=${value}; Path=/; Max-Age=${CONSENT_MAX_AGE}; SameSite=Lax${secure ? "; Secure" : ""}`;
}

/** Параметры Consent Mode v2 для gtag('consent', …). */
export function gtagConsent(value: Consent) {
  return {
    ad_storage: value,
    ad_user_data: value,
    ad_personalization: value,
    analytics_storage: value,
  };
}

/** Cookie Google Analytics, Google Ads и Яндекс Метрики — удаляем при отказе. */
const TRACKING_COOKIE =
  /^(_ga|_gid|_gat|_gcl|_ym|_yasc|yandexuid|ymex|yabs-sid)/;

export function trackingCookieNames(cookies: string): string[] {
  return cookies
    .split(";")
    .map((part) => part.split("=")[0].trim())
    .filter((name) => TRACKING_COOKIE.test(name));
}
