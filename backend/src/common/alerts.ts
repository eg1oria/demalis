import { Logger } from '@nestjs/common';
import { SITE_NAME } from '../shared/site';
import { sendTelegramMessage } from '../telegram/send';

const logger = new Logger('Alerts');

/** Одинаковая ошибка — в Telegram не чаще раза в 10 минут. */
export const ALERT_COOLDOWN_MS = 10 * 60 * 1000;
/** Лимит сообщения Telegram — 4096 символов; оставляем запас на разметку. */
const MAX_TEXT = 3500;

const lastSent = new Map<string, number>();

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function describe(error: unknown): { message: string; stack: string } {
  if (error instanceof Error)
    return { message: error.message, stack: error.stack ?? error.message };
  const message = typeof error === 'string' ? error : JSON.stringify(error);
  return { message, stack: message };
}

/** Текст для админа: где, что, начало стека. Чистая функция для тестов. */
export function alertText(context: string, error: unknown): string {
  const { stack } = describe(error);
  const body = stack.length > MAX_TEXT ? `${stack.slice(0, MAX_TEXT)}…` : stack;
  return `⚠️ <b>${escapeHtml(SITE_NAME)}: ошибка</b> — ${escapeHtml(context)}\n<pre>${escapeHtml(body)}</pre>`;
}

/** Пора ли слать: та же ошибка в том же месте не чаще ALERT_COOLDOWN_MS. */
export function shouldAlert(key: string, now: number): boolean {
  const last = lastSent.get(key);
  if (last !== undefined && now - last < ALERT_COOLDOWN_MS) return false;
  lastSent.set(key, now);
  // Не копим ключи бесконечно.
  if (lastSent.size > 500)
    for (const [k, t] of lastSent)
      if (now - t >= ALERT_COOLDOWN_MS) lastSent.delete(k);
  return true;
}

export function resetAlerts() {
  lastSent.clear();
}

/**
 * Ошибка → лог и сообщение в Telegram-чат админа (ADMIN_TELEGRAM_CHAT_ID).
 * Никогда не бросает: сбой отправки только пишется в лог.
 */
export async function reportError(
  context: string,
  error: unknown,
  now: number = Date.now(),
): Promise<void> {
  const { message, stack } = describe(error);
  logger.error(`${context}: ${stack}`);
  if (!shouldAlert(`${context}|${message}`, now)) return;
  try {
    await sendTelegramMessage(
      process.env.ADMIN_TELEGRAM_CHAT_ID,
      alertText(context, error),
    );
  } catch (e) {
    logger.error(
      `Не удалось отправить ошибку в Telegram: ${describe(e).message}`,
    );
  }
}
