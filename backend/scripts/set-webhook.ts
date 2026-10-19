/**
 * Подключает бота к бэкенду: говорит Telegram, куда присылать сообщения.
 * Запуск: npm run bot:webhook (берёт ключи из backend/.env).
 * Нужны TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET и PUBLIC_API_URL (https-адрес бэкенда).
 */
import 'dotenv/config';
import { Api } from 'grammy';

const token = process.env.TELEGRAM_BOT_TOKEN;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
const api = process.env.PUBLIC_API_URL?.replace(/\/$/, '');

if (!token || !secret || !api) {
  console.error(
    'Заполни TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET и PUBLIC_API_URL в backend/.env',
  );
  process.exit(1);
}
if (!api.startsWith('https://')) {
  console.error('Telegram принимает только https-адрес:', api);
  process.exit(1);
}

async function main() {
  const bot = new Api(token!, {
    apiRoot: process.env.TELEGRAM_API_ROOT || 'https://api.telegram.org',
  });
  const url = `${api}/telegram/webhook`;
  await bot.setWebhook(url, {
    secret_token: secret,
    allowed_updates: ['message', 'callback_query'],
  });
  const me = await bot.getMe();
  const info = await bot.getWebhookInfo();
  console.log(`Готово: @${me.username} → ${info.url}`);
  if (info.last_error_message)
    console.log('Последняя ошибка Telegram:', info.last_error_message);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
