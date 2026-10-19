"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { CheckIcon, ShareIcon } from "@/components/site/Icons";

/** «Поделиться»: системное меню телефона, иначе — копирование ссылки. */
export function ShareButton({
  title,
  variant = "photo",
}: {
  title: string;
  variant?: "photo" | "plain";
}) {
  const t = useTranslations("Place");
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // Закрыли меню — ничего не делаем.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Буфер недоступен (старый браузер) — молча.
    }
  };

  const icon = copied ? <CheckIcon size={18} /> : <ShareIcon size={18} />;

  return (
    <button
      type="button"
      onClick={share}
      aria-label={variant === "photo" ? t("share") : undefined}
      className={
        variant === "photo"
          ? "flex size-11 items-center justify-center rounded-full bg-white/95 text-text"
          : "flex h-11 flex-1 items-center justify-center gap-2 rounded-[10px] border border-line text-sm transition-colors hover:border-text"
      }
    >
      {icon}
      {variant === "plain" && (copied ? t("copied") : t("share"))}
      <span aria-live="polite" className="sr-only">
        {copied ? t("copied") : ""}
      </span>
    </button>
  );
}
