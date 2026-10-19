import { getTranslations, setRequestLocale } from "next-intl/server";
import { Header } from "@/components/Header";
import { LegalDocument } from "@/components/site/LegalDocument";
import { PRICING } from "@/config/pricing";
import { OFFER } from "@/content/offer";
import type { Locale } from "@/i18n/routing";
import { formatTenge } from "@/lib/format";
import { legalMetadata, legalUpdated } from "@/lib/legalPage";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/offer">) {
  return legalMetadata((await params).locale, "offer");
}

/** Публичная оферта для владельцев: тарифы из src/config/pricing.ts. */
export default async function OfferPage({
  params,
}: PageProps<"/[locale]/offer">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("Legal");
  const prices = Object.fromEntries(
    PRICING.map((plan) => [
      `price_${plan.id}`,
      plan.price === 0 ? t("free") : formatTenge(plan.price, locale),
    ]),
  );
  return (
    <>
      <Header />
      <LegalDocument
        title={t("offerTitle")}
        subtitle={t("updated", { date: legalUpdated(locale) })}
        sections={OFFER[locale as Locale]}
        vars={prices}
      />
    </>
  );
}
