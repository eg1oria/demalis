import "server-only";

/**
 * Отправка сообщения через Telegram Bot API (без grammY: бот появится на Этапе 5).
 * Нет токена или чата — молча пропускаем (например, локально).
 */
export async function sendTelegramMessage(
  chatId: string | number | undefined,
  html: string,
): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || !chatId) {
    console.warn(
      "Telegram: не заданы TELEGRAM_BOT_TOKEN или chat id — пропуск",
    );
    return;
  }

  const response = await fetch(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: html,
        parse_mode: "HTML",
        link_preview_options: { is_disabled: true },
      }),
      signal: AbortSignal.timeout(10_000),
    },
  );
  if (!response.ok) {
    // Токен в тексте ошибки не печатаем.
    throw new Error(
      `Telegram sendMessage: ${response.status} ${await response.text()}`,
    );
  }
}
