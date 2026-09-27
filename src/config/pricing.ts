// Тарифы для владельцев (раздел 9 ТЗ). Цены — стартовая гипотеза:
// меняй здесь, тексты возле цен — в messages (OwnersPage.plan_*).
export const PRICING = [
  { id: "free", price: 0, period: null },
  { id: "pro", price: 15000, period: "month" },
  { id: "promo", price: 20000, period: "week" },
  { id: "video", price: 40000, period: "once" },
] as const;

export type PricingPlan = (typeof PRICING)[number];

/**
 * Что даёт тариф (Этап 8). По ТЗ у free статус занятости не показывается —
 * только «Уточняйте наличие». Если на старте, пока все на free, это
 * оставляет каталог без «Свободно» — поставь free.availability = true.
 */
export const PLAN_FEATURES = {
  free: {
    photos: 5,
    video: false,
    availability: false,
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
