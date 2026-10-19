import { createHash, randomBytes } from 'node:crypto';
import type { PrismaClient } from '../generated/prisma/client';

/** Ссылка на отзыв: токен знает только гость, в базе — sha256. */
export function newReviewToken(): { token: string; hash: string } {
  const token = randomBytes(24).toString('base64url');
  return { token, hash: reviewTokenHash(token) };
}

export function reviewTokenHash(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** Токен из адреса: base64url, 32 символа. Мусор не ищем в базе. */
export function isReviewToken(value: unknown): value is string {
  return typeof value === 'string' && /^[\w-]{32}$/.test(value);
}

/**
 * Можно ли попросить отзыв: заявка подтверждена и гость уже выехал.
 * today — сегодня по Алматы, date_to — дата выезда (YYYY-MM-DD).
 */
export function canInviteReview(
  lead: { status: string; date_to: string | null },
  today: string,
): boolean {
  return (
    lead.status === 'confirmed' &&
    lead.date_to !== null &&
    lead.date_to <= today
  );
}

/** Пересчёт числа опубликованных отзывов и средней оценки объекта. */
export async function refreshPlaceRating(
  prisma: PrismaClient,
  placeId: string,
): Promise<void> {
  const { _count, _avg } = await prisma.review.aggregate({
    where: { place_id: placeId, status: 'published' },
    _count: { _all: true },
    _avg: { rating: true },
  });
  await prisma.place.update({
    where: { id: placeId },
    data: {
      review_count: _count._all,
      rating_avg:
        _avg.rating === null ? null : Math.round(_avg.rating * 10) / 10,
    },
  });
}
