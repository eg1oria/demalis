// Копия frontend/src/config/pricing.ts — менять вместе.
// Тарифы для владельцев (раздел 9 ТЗ). Цены — стартовая гипотеза:
// меняй здесь, тексты возле цен — в messages (OwnersPage.plan_*).
export const PRICING = [
  { id: 'free', price: 0, period: null },
  { id: 'pro', price: 15000, period: 'month' },
  { id: 'promo', price: 20000, period: 'week' },
  { id: 'promo_holiday', price: 30000, period: 'week' },
  { id: 'video', price: 40000, period: 'once' },
] as const;

export type PricingPlan = (typeof PRICING)[number];

/**
 * Что даёт тариф (Этап 8). По ТЗ у free статус занятости не показывается,
 * но на старте все владельцы на free — без календаря каталог и главная
 * оставались бы без «Свободно» (Этап 10, решение владельца). Когда появятся
 * платные владельцы, можно вернуть free.availability = false.
 */
export const PLAN_FEATURES = {
  free: {
    photos: 5,
    video: false,
    availability: true,
    verified: false,
    botStats: false,
  },
  pro: {
    photos: 20,
    video: true,
    availability: true,
    verified: true,
    botStats: true,
  },
} as const;

/** Сколько объектов с продвижением максимум в первом экране каталога. */
export const PROMOTED_SLOTS = 2;

/** За сколько дней до конца Pro напомнить владельцу в бот. */
export const PRO_REMINDER_DAYS = 5;
