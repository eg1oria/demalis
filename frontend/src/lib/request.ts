/**
 * IP посетителя. На Vercel первый адрес в x-forwarded-for ставит сама
 * платформа, подделать его из браузера нельзя.
 */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip")?.trim() || "unknown";
}

/** Поисковые роботы и превью ссылок в мессенджерах — не считаем их кликами и просмотрами. */
export function isBot(userAgent: string | null): boolean {
  // Встроенные браузеры Telegram и Instagram — живые люди, их не отсекаем;
  // превью ссылок (TelegramBot, WhatsApp/…) — роботы.
  return (
    !userAgent ||
    /^WhatsApp\//.test(userAgent) ||
    /bot|crawl|spider|slurp|facebookexternalhit|headless/i.test(userAgent)
  );
}
