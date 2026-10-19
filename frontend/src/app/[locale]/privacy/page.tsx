import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Header } from "@/components/Header";
import { LegalDocument } from "@/components/site/LegalDocument";
import { SITE_NAME } from "@/config/site";
import type { Locale } from "@/i18n/routing";
import { PRIVACY } from "@/content/privacy";
import { legalUpdated } from "@/lib/legalPage";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/privacy">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "Privacy",
  });
  return pageMetadata({
    locale,
    path: "/privacy",
    title: t("title"),
    description: t("description", { site: SITE_NAME }),
  });
}

export default async function PrivacyPage({
  params,
}: PageProps<"/[locale]/privacy">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("Privacy");

  return (
    <>
      <Header />
      <LegalDocument
        title={t("title")}
        subtitle={t("updated", { date: legalUpdated(locale) })}
        sections={PRIVACY[locale as Locale]}
      />
    </>
  );
}
