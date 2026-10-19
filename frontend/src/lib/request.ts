import { createHmac } from "node:crypto";

/**
 * IP посетителя. На Vercel первый адрес в x-forwarded-for ставит сама
 * платформа, подделать его из браузера нельзя.
 */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Ключ для лимита форм: IP не храним, только его HMAC-хэш с секретом сервера.
 * scope — у каждой формы свой счётчик (заявки гостей, заявки владельцев).
 */
export function rateLimitKey(
  ip: string,
  secret: string,
  scope: "lead" | "owner" = "lead",
): string {
  return createHmac("sha256", secret).update(`${scope}:${ip}`).digest("hex");
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
