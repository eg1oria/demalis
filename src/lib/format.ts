/** «42 000 ₸» */
export function formatTenge(amount: number, locale: string): string {
  return `${new Intl.NumberFormat(locale === "kk" ? "kk-KZ" : "ru-RU").format(amount)} ₸`;
}

/** Разбивка минут на часы и минуты для подписи «1 ч 10 мин». */
export function splitMinutes(total: number): { h: number; m: number } {
  return { h: Math.floor(total / 60), m: total % 60 };
}
