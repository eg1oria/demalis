import { useLocale, useTranslations } from "next-intl";
import type { PublicReview } from "@/lib/catalog/query";
import { formatRating } from "@/lib/format";
import { Description } from "./Description";

/** Звёзды оценки: заполненные — цветом «мало мест», пустые — линией. */
export function Stars({
  rating,
  size = 16,
}: {
  rating: number;
  size?: number;
}) {
  // 4,5 — четыре звезды, 4,8 — пять: средняя не завышается.
  const full = Math.min(5, Math.floor(rating + 0.25));
  return (
    <span
      aria-hidden="true"
      className="tracking-[0.08em]"
      style={{ fontSize: size }}
    >
      <span className="text-status-limited">{"★".repeat(full)}</span>
      <span className="text-line-strong">{"★".repeat(5 - full)}</span>
    </span>
  );
}

/** Отзывы гостей с подтверждённой заявкой: сводка и список. */
export function Reviews({
  reviews,
  count,
  average,
}: {
  reviews: PublicReview[];
  count: number;
  average: number;
}) {
  const t = useTranslations("Reviews");
  const locale = useLocale();
  const month = new Intl.DateTimeFormat(locale === "kk" ? "kk-KZ" : "ru-RU", {
    timeZone: "UTC",
    month: "long",
    year: "numeric",
  });
  const rating = formatRating(average, locale);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <span className="tabular font-display text-[40px] leading-none font-medium tracking-[-0.04em]">
          {rating}
        </span>
        <div className="flex flex-col gap-1">
          <Stars rating={average} size={18} />
          <span className="sr-only">{t("rating", { rating })}</span>
          <span className="text-sm text-text-secondary">
            {t("count", { n: count })}
          </span>
        </div>
      </div>
      <p className="-mt-2 flex items-center gap-2 text-[13px] text-text-muted">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
        {t("note")}
      </p>
      <ul className="flex flex-col divide-y divide-line border-y border-line">
        {reviews.map((review) => (
          <li key={review.id} className="flex flex-col gap-2 py-5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <span className="font-medium">
                {review.author_name}
                {review.stay_date && (
                  <span className="font-normal text-text-muted">
                    {" · "}
                    {t("stayed", {
                      month: month.format(
                        new Date(`${review.stay_date}T00:00:00Z`),
                      ),
                    })}
                  </span>
                )}
              </span>
              <span className="flex items-center">
                <Stars rating={review.rating} size={14} />
                <span className="sr-only">
                  {t("rating", { rating: review.rating })}
                </span>
              </span>
            </div>
            {review.text && <Description text={review.text} />}
          </li>
        ))}
      </ul>
    </div>
  );
}
