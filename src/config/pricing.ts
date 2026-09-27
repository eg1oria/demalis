// Тарифы для владельцев (раздел 9 ТЗ). Цены — стартовая гипотеза:
// меняй здесь, тексты возле цен — в messages (OwnersPage.plan_*).
export const PRICING = [
  { id: "free", price: 0, period: null },
  { id: "pro", price: 15000, period: "month" },
  { id: "promo", price: 20000, period: "week" },
  { id: "video", price: 40000, period: "once" },
] as const;

export type PricingPlan = (typeof PRICING)[number];
