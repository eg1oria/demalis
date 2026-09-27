import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { Suspense } from "react";
import { Footer } from "@/components/site/Footer";
import { YandexMetrika } from "@/components/site/YandexMetrika";
import { SITE_NAME } from "@/config/site";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/seo";
import { literata, onest } from "../fonts";
import "../globals.css";

const CLIENT_NAMESPACES = [
  "Header",
  "HomePage",
  "Format",
  "Catalog",
  "Chips",
  "Types",
  "Directions",
  "Amenities",
  "Place",
  "Status",
  "Calendar",
  "LeadForm",
  "Collections",
  "OwnerForm",
  "Plans",
] as const;

const METRIKA_ID = process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: `${SITE_NAME} — ${t("homeTitle")}`,
      template: `%s — ${SITE_NAME}`,
    },
    description: t("description"),
    // Подтверждение прав в Google Search Console и Яндекс Вебмастере (docs/SEO.md).
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
      yandex: process.env.YANDEX_VERIFICATION || undefined,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  // В браузер отдаём только переводы клиентских компонентов — меньше JS на странице.
  const messages = await getMessages();
  const clientMessages = Object.fromEntries(
    CLIENT_NAMESPACES.map((ns) => [ns, messages[ns]]),
  );

  return (
    <html
      lang={locale}
      className={`${onest.variable} ${literata.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <NextIntlClientProvider messages={clientMessages}>
          <div className="flex flex-1 flex-col">{children}</div>
          <Footer />
        </NextIntlClientProvider>
        {METRIKA_ID && (
          <Suspense>
            <YandexMetrika id={METRIKA_ID} />
          </Suspense>
        )}
      </body>
    </html>
  );
}
