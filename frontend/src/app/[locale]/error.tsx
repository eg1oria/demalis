"use client";

import { useTranslations } from "next-intl";
import { Header } from "@/components/Header";
import { Link } from "@/i18n/navigation";

/** Ошибка на странице сайта. Сама ошибка уже ушла админу (src/instrumentation.ts). */
export default function ErrorPage({
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  const t = useTranslations("ErrorPage");

  return (
    <>
      <Header />
      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col items-start gap-5 px-5 pt-16 md:px-10 md:pt-28 lg:px-20">
        <h1 className="font-display text-2xl font-medium tracking-[-0.03em] md:text-3xl">
          {t("title")}
        </h1>
        <p className="max-w-md text-text-secondary">{t("text")}</p>
        <div className="mt-2 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={retry}
            className="flex h-12 items-center rounded-[10px] bg-text px-5 text-[15px] font-medium text-white"
          >
            {t("retry")}
          </button>
          <Link
            href="/"
            className="flex h-12 items-center rounded-[10px] border border-line px-5 text-[15px] font-medium"
          >
            {t("toHome")}
          </Link>
        </div>
      </main>
    </>
  );
}
