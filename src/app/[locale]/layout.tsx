import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { Footer } from "@/components/site/Footer";
import { SITE_NAME } from "@/config/site";
import { routing } from "@/i18n/routing";
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
] as const;

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
    title: SITE_NAME,
    description: t("description"),
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
      </body>
    </html>
  );
}
