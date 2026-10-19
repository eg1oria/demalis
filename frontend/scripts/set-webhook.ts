/**
 * Подключает бота к сайту: говорит Telegram, куда присылать сообщения.
 * Запуск: npm run bot:webhook (берёт ключи из .env.local).
 * Нужны TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET и NEXT_PUBLIC_SITE_URL (https).
 */
import { Api } from "grammy";

const token = process.env.TELEGRAM_BOT_TOKEN;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");

if (!token || !secret || !site) {
  console.error(
    "Заполни TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET и NEXT_PUBLIC_SITE_URL в .env.local",
  );
  process.exit(1);
}
if (!site.startsWith("https://")) {
  console.error("Telegram принимает только https-адрес сайта:", site);
  process.exit(1);
}

async function main() {
  const api = new Api(token!, {
    apiRoot: process.env.TELEGRAM_API_ROOT || "https://api.telegram.org",
  });
  const url = `${site}/api/telegram/webhook`;
  await api.setWebhook(url, {
    secret_token: secret,
    allowed_updates: ["message", "callback_query"],
  });
  const me = await api.getMe();
  const info = await api.getWebhookInfo();
  console.log(`Готово: @${me.username} → ${info.url}`);
  if (info.last_error_message)
    console.log("Последняя ошибка Telegram:", info.last_error_message);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
