import type { Metadata } from "next";
import Link from "next/link";
import { ReviewModeration } from "@/components/admin/ReviewModeration";
import { inputClass, secondaryButtonClass } from "@/components/admin/ui";
import { TIME_ZONE } from "@/config/site";
import { requireAdminPage } from "@/lib/admin/auth";
import { adminApi, query } from "@/lib/api/client";
import type { Tables } from "@/lib/api/types";
import { REVIEW_STATUSES, type ReviewStatus } from "@/lib/reviews/validate";

export const metadata: Metadata = { title: "Отзывы" };

const LIMIT = 200;

const createdFormat = new Intl.DateTimeFormat("ru-RU", {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const dateFormat = new Intl.DateTimeFormat("ru-RU", {
  timeZone: "UTC",
  day: "numeric",
  month: "short",
});

const formatDate = (iso: string) =>
  dateFormat.format(new Date(`${iso}T00:00:00Z`));

type AdminReview = Tables<"reviews"> & {
  place: { id: string; name_ru: string; slug: string };
  lead: { phone: string; date_from: string | null; date_to: string | null };
};

/** Отзывы гостей: новые ждут проверки, на сайт — только после «Опубликовать». */
export default async function ReviewsPage({
  searchParams,
}: PageProps<"/admin/reviews">) {
  await requireAdminPage();
  const params = await searchParams;
  // По умолчанию — новые, которые ждут проверки.
  const status =
    typeof params.status === "string" && params.status in REVIEW_STATUSES
      ? (params.status as ReviewStatus)
      : params.status === "all"
        ? null
        : "pending";

  const reviews = await adminApi<AdminReview[]>(
    `/admin/reviews${query({ status, limit: LIMIT })}`,
  );

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-xl font-medium tracking-[-0.03em]">
        Отзывы
      </h1>
      <p className="text-sm text-text-secondary">
        Только от гостей с подтверждённой заявкой. Ссылку гостю отправляйте из
        «Заявок» кнопкой «Попросить отзыв».
      </p>

      <form className="flex flex-col gap-2 sm:flex-row">
        <select
          name="status"
          defaultValue={status ?? "all"}
          className={`${inputClass} sm:w-64`}
        >
          <option value="all">Все, кроме неотвеченных</option>
          {Object.entries(REVIEW_STATUSES).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button type="submit" className={secondaryButtonClass}>
          Показать
        </button>
      </form>

      <p className="text-sm text-text-muted">Найдено: {reviews.length}</p>

      <ul className="flex flex-col gap-2">
        {reviews.map((review) => (
          <li
            key={review.id}
            className="flex flex-col gap-3 rounded-[14px] border border-line-soft bg-surface p-3 sm:flex-row sm:items-start"
          >
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="text-xs text-text-muted">
                {createdFormat.format(
                  new Date(review.submitted_at ?? review.created_at),
                )}
                {" · "}
                <Link
                  href={`/admin/places/${review.place.id}`}
                  className="text-text-secondary hover:underline"
                >
                  {review.place.name_ru}
                </Link>
              </span>
              <span className="font-medium">
                {review.rating != null && (
                  <span
                    className="text-status-limited"
                    aria-label={`Оценка ${review.rating} из 5`}
                  >
                    {"★".repeat(review.rating)}
                    <span className="text-line-strong">
                      {"★".repeat(5 - review.rating)}
                    </span>{" "}
                  </span>
                )}
                {review.author_name} ·{" "}
                <a href={`tel:${review.lead.phone}`} className="text-accent">
                  {review.lead.phone}
                </a>
              </span>
              {review.lead.date_from && review.lead.date_to && (
                <span className="text-sm text-text-secondary">
                  Отдыхал(а): {formatDate(review.lead.date_from)} –{" "}
                  {formatDate(review.lead.date_to)}
                </span>
              )}
              {review.text ? (
                <p className="text-sm break-words whitespace-pre-line">
                  {review.text}
                </p>
              ) : (
                <p className="text-sm text-text-muted">Гость ещё не написал</p>
              )}
            </div>
            {review.status !== "invited" && (
              <ReviewModeration id={review.id} status={review.status} />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
