import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LEGAL } from "@/config/legal";
import { SITE_NAME } from "@/config/site";
import type { Locale } from "@/i18n/routing";
import { pageMetadata } from "@/lib/seo";

/** Дата редакции юридических страниц (LEGAL.updated) на языке страницы. */
export function legalUpdated(locale: string): string {
  return new Date(`${LEGAL.updated}T00:00:00Z`).toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

type LegalPage = "about" | "contacts" | "terms" | "offer" | "verified";

/** Метаданные страниц «О нас», «Контакты», соглашения, оферты и «Проверено». */
export async function legalMetadata(
  locale: string,
  page: LegalPage,
): Promise<Metadata> {
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "Legal",
  });
  return pageMetadata({
    locale,
    path: `/${page}`,
    title: t(`${page}Title`),
    description: t(`${page}Description`, { site: SITE_NAME }),
  });
}
