import { getTranslations, setRequestLocale } from "next-intl/server";
import { Header } from "@/components/Header";
import { LegalDocument } from "@/components/site/LegalDocument";
import { ABOUT } from "@/content/about";
import type { Locale } from "@/i18n/routing";
import { legalMetadata } from "@/lib/legalPage";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/about">) {
  return legalMetadata((await params).locale, "about");
}

/** «О нас»: что за сервис, чем не является, откуда цены, кто владелец сайта. */
export default async function AboutPage({
  params,
}: PageProps<"/[locale]/about">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("Legal");
  return (
    <>
      <Header />
      <LegalDocument
        title={t("aboutTitle")}
        sections={ABOUT[locale as Locale]}
      />
    </>
  );
}
