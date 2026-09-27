"use client";

import { useTranslations } from "next-intl";
import { ChevronLeftIcon } from "@/components/site/Icons";
import { useRouter } from "@/i18n/navigation";

/** Назад — в историю, если пришли с нашего сайта, иначе в каталог. */
export function BackButton() {
  const t = useTranslations("Place");
  const router = useRouter();

  return (
    <button
      type="button"
      aria-label={t("back")}
      onClick={() => {
        const fromSite =
          document.referrer &&
          new URL(document.referrer).origin === location.origin;
        if (fromSite && history.length > 1) router.back();
        else router.push("/catalog");
      }}
      className="flex size-11 items-center justify-center rounded-full bg-white/95"
    >
      <ChevronLeftIcon />
    </button>
  );
}
