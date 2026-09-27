import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { SITE_NAME } from "@/config/site";
import type { Locale } from "@/i18n/routing";

export default function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = use(params);
  setRequestLocale(locale as Locale);
  const t = useTranslations("HomePage");

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-3 px-4 py-12">
      <h1 className="font-serif text-4xl font-medium">{SITE_NAME}</h1>
      <p className="text-lg text-text-secondary">{t("tagline")}</p>
      <p className="text-text-muted">{t("stub")}</p>
    </main>
  );
}
