// Копия: backend/src/shared/reviews/validate.ts — менять вместе.

/** Статусы отзыва и подписи для админки. */
export const REVIEW_STATUSES = {
  invited: "Ссылка отправлена",
  pending: "Ждёт проверки",
  published: "Опубликован",
  rejected: "Отклонён",
} as const;

export type ReviewStatus = keyof typeof REVIEW_STATUSES;

export const REVIEW_LIMITS = {
  minText: 20,
  maxText: 2000,
  name: 50,
} as const;

export type ReviewField = "rating" | "text" | "name" | "consent";
export type ReviewErrorCode = "required" | "invalid" | "tooShort" | "tooLong";

export type ReviewInput = { rating: number; text: string; author_name: string };

export type RawReviewInput = Partial<Record<ReviewField, string>>;

/** Проверка отзыва гостя: оценка 1–5, текст, имя и согласие на публикацию. */
export function validateReview(
  raw: RawReviewInput,
):
  | { ok: true; data: ReviewInput }
  | { ok: false; errors: Partial<Record<ReviewField, ReviewErrorCode>> } {
  const errors: Partial<Record<ReviewField, ReviewErrorCode>> = {};

  const rating = Number(raw.rating);
  if (!raw.rating) errors.rating = "required";
  else if (!Number.isInteger(rating) || rating < 1 || rating > 5)
    errors.rating = "invalid";

  // Пустые строки подряд схлопываем, переносы оставляем.
  const text = (raw.text ?? "")
    .trim()
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n");
  if (!text) errors.text = "required";
  else if (text.length < REVIEW_LIMITS.minText) errors.text = "tooShort";
  else if (text.length > REVIEW_LIMITS.maxText) errors.text = "tooLong";

  const name = raw.name?.trim().replace(/\s+/g, " ") ?? "";
  if (!name) errors.name = "required";
  else if (name.length > REVIEW_LIMITS.name) errors.name = "tooLong";

  if (raw.consent !== "on") errors.consent = "required";

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, data: { rating, text, author_name: name } };
}

/** На сайте — только имя, без фамилии: «Айгерим Сапарова» → «Айгерим». */
export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? "";
}
