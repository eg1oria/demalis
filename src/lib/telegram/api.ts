import "server-only";
import { Api } from "grammy";

/**
 * Адрес Bot API. Меняется только для локальных проверок с поддельным
 * сервером Telegram (TELEGRAM_API_ROOT); в работе — api.telegram.org.
 */
export const TELEGRAM_API_ROOT =
  process.env.TELEGRAM_API_ROOT || "https://api.telegram.org";

export function botToken(): string | null {
  return process.env.TELEGRAM_BOT_TOKEN || null;
}

/** Клиент Bot API для отправки вне ответа на сообщение (заявки, напоминания). */
export function createBotApi(): Api | null {
  const token = botToken();
  return token ? new Api(token, { apiRoot: TELEGRAM_API_ROOT }) : null;
}

/** Логин бота для ссылки t.me/…; null — бот не настроен или Telegram недоступен. */
export async function getBotUsername(): Promise<string | null> {
  const api = createBotApi();
  if (!api) return null;
  try {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Telegram getMe: таймаут")), 3000),
    );
    return (await Promise.race([api.getMe(), timeout])).username;
  } catch (e) {
    console.error("getBotUsername", e);
    return null;
  }
}
