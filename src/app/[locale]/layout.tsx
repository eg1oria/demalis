import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Header } from "@/components/Header";
import { SITE_NAME } from "@/config/site";
import { routing } from "@/i18n/routing";
import { literata, onest } from "../fonts";
import "../globals.css";

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

  return (
    <html
      lang={locale}
      className={`${onest.variable} ${literata.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <NextIntlClientProvider>
          <Header />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
