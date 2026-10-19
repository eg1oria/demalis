import { createHmac } from 'node:crypto';

/**
 * Ключ для лимита форм: IP не храним, только его HMAC-хэш с секретом сервера.
 * scope — у каждой формы свой счётчик (заявки гостей, заявки владельцев).
 */
export function rateLimitKey(
  ip: string,
  secret: string,
  scope: 'lead' | 'owner' = 'lead',
): string {
  return createHmac('sha256', secret).update(`${scope}:${ip}`).digest('hex');
}
