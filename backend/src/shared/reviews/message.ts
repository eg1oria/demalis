import type { ReviewInput } from './validate';

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Админу в Telegram: гость оставил отзыв, нужно проверить (parse_mode HTML). */
export function reviewTelegramMessage(
  review: ReviewInput,
  placeName: string,
  adminUrl: string | null,
): string {
  const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
  const lines = [
    `<b>Новый отзыв</b> — ${escapeHtml(placeName)}`,
    `${stars} · ${escapeHtml(review.author_name)}`,
    '',
    escapeHtml(review.text),
  ];
  if (adminUrl)
    lines.push(
      '',
      `<a href="${escapeHtml(adminUrl)}">Проверить и опубликовать</a>`,
    );
  return lines.join('\n');
}
