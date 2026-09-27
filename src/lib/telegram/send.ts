import "server-only";
import { createBotApi } from "./api";

/**
 * Сообщение с HTML-разметкой (уведомления админу).
 * Нет токена или чата — молча пропускаем (например, локально).
 */
export async function sendTelegramMessage(
  chatId: string | number | undefined,
  html: string,
): Promise<void> {
  const api = createBotApi();
  if (!api || !chatId) {
    console.warn(
      "Telegram: не заданы TELEGRAM_BOT_TOKEN или chat id — пропуск",
    );
    return;
  }
  await api.sendMessage(chatId, html, {
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
  });
}
