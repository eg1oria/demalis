"use client";

import { useState, useTransition } from "react";
import { setReviewStatus } from "@/app/admin/(panel)/reviews/actions";
import { REVIEW_STATUSES, type ReviewStatus } from "@/lib/reviews/validate";
import { primaryButtonClass, secondaryButtonClass } from "./ui";

/** Кнопки модерации: опубликовать, отклонить, скрыть с сайта. */
export function ReviewModeration({
  id,
  status: initial,
}: {
  id: string;
  status: ReviewStatus;
}) {
  const [status, setStatus] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const change = (next: "published" | "rejected") => {
    setError(null);
    startTransition(async () => {
      const result = await setReviewStatus(id, next);
      if (result.error) setError(result.error);
      else setStatus(next);
    });
  };

  const small = "h-9 px-3 text-sm";
  return (
    <div className="flex flex-col gap-2 sm:w-48">
      <span className="text-xs text-text-muted">{REVIEW_STATUSES[status]}</span>
      {status !== "published" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => change("published")}
          className={`${primaryButtonClass} ${small}`}
        >
          Опубликовать
        </button>
      )}
      {status === "pending" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => change("rejected")}
          className={`${secondaryButtonClass} ${small}`}
        >
          Отклонить
        </button>
      )}
      {status === "published" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => change("rejected")}
          className={`${secondaryButtonClass} ${small}`}
        >
          Скрыть с сайта
        </button>
      )}
      {error && (
        <span role="status" className="text-xs text-status-limited-text">
          Ошибка: {error}
        </span>
      )}
    </div>
  );
}
