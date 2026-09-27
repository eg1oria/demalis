import { webhookCallback } from "grammy";
import { createBot } from "@/lib/bot/bot";
import { botToken } from "@/lib/telegram/api";

let handler: ((request: Request) => Promise<Response>) | null = null;

/**
 * Webhook бота. Telegram присылает секрет в заголовке
 * X-Telegram-Bot-Api-Secret-Token — без него grammY отвечает 401.
 */
export async function POST(request: Request) {
  const token = botToken();
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!token || !secret)
    return new Response("Бот не настроен", { status: 503 });

  handler ??= webhookCallback(createBot(token), "std/http", {
    secretToken: secret,
  });
  try {
    return await handler(request);
  } catch (e) {
    // Отвечаем 200: иначе Telegram будет бесконечно присылать то же сообщение.
    console.error("telegram webhook", e);
    return new Response(null, { status: 200 });
  }
}
