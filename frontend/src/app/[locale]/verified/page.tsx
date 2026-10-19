import { getTranslations, setRequestLocale } from "next-intl/server";
import { Header } from "@/components/Header";
import { LegalDocument } from "@/components/site/LegalDocument";
import { LEGAL } from "@/config/legal";
import { VERIFIED, VERIFIED_CHECKS } from "@/content/verified";
import type { Locale } from "@/i18n/routing";
import { legalMetadata } from "@/lib/legalPage";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/verified">) {
  return legalMetadata((await params).locale, "verified");
}

/** Что значит плашка «Проверено»: список проверок — LEGAL.verifiedChecks. */
export default async function VerifiedPage({
  params,
}: PageProps<"/[locale]/verified">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("Legal");
  const sections = VERIFIED[locale as Locale].map((section) =>
    section.items?.includes(VERIFIED_CHECKS)
      ? { ...section, items: LEGAL.verifiedChecks.split("|") }
      : section,
  );
  return (
    <>
      <Header />
      <LegalDocument title={t("verifiedTitle")} sections={sections} />
    </>
  );
}
