import { timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';

/** Сравнение секретов за постоянное время. */
export function sameSecret(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

/** Запрос пришёл от сервера Next.js: с общим секретом INTERNAL_API_SECRET. */
export function fromFrontendServer(req: Request): boolean {
  const secret = process.env.INTERNAL_API_SECRET;
  const sent = req.header('x-internal-secret');
  return Boolean(secret && sent && sameSecret(sent, secret));
}

/**
 * IP посетителя. Формы приходят от сервера Next.js, поэтому настоящий IP
 * он передаёт в X-Client-Ip — верим заголовку, только если вместе с ним
 * пришёл общий секрет INTERNAL_API_SECRET. Иначе — IP соединения.
 */
export function clientIp(req: Request): string {
  const secret = process.env.INTERNAL_API_SECRET;
  const sent = req.header('x-internal-secret');
  const forwarded = req.header('x-client-ip')?.trim();
  if (secret && sent && forwarded && sameSecret(sent, secret)) return forwarded;
  return req.ip ?? 'unknown';
}
