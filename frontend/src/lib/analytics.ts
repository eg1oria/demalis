/**
 * События для Google Analytics 4 и конверсии Google Ads (gtag.js).
 * Номера тегов и метки конверсий — в переменных окружения (docs/SEO.md,
 * раздел «Google Ads»). Без них функции молча ничего не делают.
 */
export type AnalyticsEvent =
  | "generate_lead" // заявка на бронь отправлена
  | "click_whatsapp" // «Написать в WhatsApp» владельцу
  | "click_call" // «Позвонить» владельцу
  | "click_instagram"
  | "owner_request" // владелец отправил форму «Добавить объект»
  | "group_request" // «Подберём за вас» для компании от 15 человек
  | "contact_whatsapp" // страница «Контакты»
  | "contact_telegram"
  | "contact_email"
  | "contact_phone";

type Gtag = (...args: unknown[]) => void;
declare global {
  interface Window {
    gtag?: Gtag;
    dataLayer?: unknown[];
  }
}

export type AdsConfig = {
  adsId?: string;
  labels: Partial<Record<AnalyticsEvent, string | undefined>>;
};

// NEXT_PUBLIC_* подставляются при сборке только при прямом обращении.
const ADS: AdsConfig = {
  adsId: process.env.NEXT_PUBLIC_GOOGLE_ADS_ID,
  labels: {
    generate_lead: process.env.NEXT_PUBLIC_ADS_CONV_LEAD,
    click_whatsapp: process.env.NEXT_PUBLIC_ADS_CONV_WHATSAPP,
    click_call: process.env.NEXT_PUBLIC_ADS_CONV_CALL,
  },
};

/** Вызовы gtag для события: само событие GA4 и, если есть метка, конверсия Ads. */
export function gtagCalls(
  event: AnalyticsEvent,
  params: Record<string, unknown> = {},
  ads: AdsConfig = ADS,
): unknown[][] {
  const calls: unknown[][] = [["event", event, params]];
  const label = ads.labels[event];
  if (ads.adsId && label)
    calls.push(["event", "conversion", { send_to: `${ads.adsId}/${label}` }]);
  return calls;
}

export function trackEvent(
  event: AnalyticsEvent,
  params?: Record<string, unknown>,
) {
  if (typeof window === "undefined" || !window.gtag) return;
  for (const call of gtagCalls(event, params)) window.gtag(...call);
}
