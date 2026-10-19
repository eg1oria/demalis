"use client";

import { useState, useTransition } from "react";
import { createReviewInvite } from "@/app/admin/(panel)/leads/actions";
import { secondaryButtonClass } from "./ui";

/** Текст для гостя в WhatsApp со ссылкой на отзыв. */
export function reviewInviteText(
  name: string,
  placeName: string,
  url: string,
): string {
  const first = name.trim().split(/\s+/)[0];
  return [
    `Здравствуйте, ${first}! Вы отдыхали в «${placeName.replace(/^\[ТЕСТ\]\s*/, "")}» по заявке с Демалыс.`,
    "Расскажите, как всё прошло, — это займёт минуту и поможет другим гостям:",
    url,
  ].join("\n");
}

/**
 * «Попросить отзыв»: создаёт личную ссылку и открывает WhatsApp гостя
 * с готовым текстом. Окно открываем сразу — иначе браузер его заблокирует.
 */
export function ReviewInviteButton({
  id,
  name,
  phone,
  placeName,
  invited,
}: {
  id: string;
  name: string;
  phone: string;
  placeName: string;
  /** Ссылку уже отправляли: повтор выдаст новую, старая перестанет работать. */
  invited: boolean;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onClick = () => {
    const tab = window.open("about:blank", "_blank");
    setMessage(null);
    startTransition(async () => {
      const result = await createReviewInvite(id);
      if (!result.url) {
        tab?.close();
        setMessage(`Ошибка: ${result.error}`);
        return;
      }
      setUrl(result.url);
      const wa = `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(
        reviewInviteText(name, placeName, result.url),
      )}`;
      if (tab) tab.location.href = wa;
      else setMessage("Браузер не открыл WhatsApp — скопируйте ссылку ниже");
    });
  };

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={onClick}
        className={`${secondaryButtonClass} h-9 text-sm sm:w-56`}
      >
        {invited ? "Отправить ссылку снова" : "Попросить отзыв"}
      </button>
      {url && (
        <input
          readOnly
          value={url}
          aria-label="Ссылка на отзыв"
          onFocus={(e) => e.currentTarget.select()}
          className="h-8 w-full rounded-md border border-line bg-surface-muted px-2 text-xs sm:w-56"
        />
      )}
      {message && (
        <span role="status" className="text-xs text-text-muted">
          {message}
        </span>
      )}
    </div>
  );
}
