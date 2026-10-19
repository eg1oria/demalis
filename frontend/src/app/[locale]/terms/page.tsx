import { getTranslations, setRequestLocale } from "next-intl/server";
import { Header } from "@/components/Header";
import { LegalDocument } from "@/components/site/LegalDocument";
import { TERMS } from "@/content/terms";
import type { Locale } from "@/i18n/routing";
import { legalMetadata, legalUpdated } from "@/lib/legalPage";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/terms">) {
  return legalMetadata((await params).locale, "terms");
}

/** Пользовательское соглашение для гостей. */
export default async function TermsPage({
  params,
}: PageProps<"/[locale]/terms">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("Legal");
  return (
    <>
      <Header />
      <LegalDocument
        title={t("termsTitle")}
        subtitle={t("updated", { date: legalUpdated(locale) })}
        sections={TERMS[locale as Locale]}
      />
    </>
  );
}
