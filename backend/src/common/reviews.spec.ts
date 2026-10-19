import { describe, expect, it } from '@jest/globals';
import {
  canInviteReview,
  isReviewToken,
  newReviewToken,
  reviewTokenHash,
} from './reviews';

describe('reviews', () => {
  it('токен: 32 символа, в базе только хэш', () => {
    const { token, hash } = newReviewToken();
    expect(isReviewToken(token)).toBe(true);
    expect(hash).toBe(reviewTokenHash(token));
    expect(hash).not.toContain(token);
    expect(isReviewToken('../etc/passwd')).toBe(false);
  });

  it('просить отзыв — только у подтверждённой заявки после выезда', () => {
    const today = '2026-10-19';
    expect(
      canInviteReview({ status: 'confirmed', date_to: '2026-10-19' }, today),
    ).toBe(true);
    expect(
      canInviteReview({ status: 'confirmed', date_to: '2026-10-20' }, today),
    ).toBe(false);
    expect(
      canInviteReview(
        { status: 'sent_to_owner', date_to: '2026-10-01' },
        today,
      ),
    ).toBe(false);
    expect(canInviteReview({ status: 'confirmed', date_to: null }, today)).toBe(
      false,
    );
  });
});
