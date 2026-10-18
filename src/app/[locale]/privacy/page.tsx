import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Header } from "@/components/Header";
import { LEGAL } from "@/config/legal";
import { SITE_NAME } from "@/config/site";
import type { Locale } from "@/i18n/routing";
import { PRIVACY } from "@/content/privacy";
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

/** Подстановка реквизитов из src/config/legal.ts в текст политики. */
function fill(text: string): string {
  return text
    .replaceAll("{site}", SITE_NAME)
    .replaceAll("{operator}", LEGAL.operator)
    .replaceAll("{email}", LEGAL.email)
    .replaceAll("{storage}", LEGAL.storage);
}

export default async function PrivacyPage({
  params,
}: PageProps<"/[locale]/privacy">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("Privacy");
  const updated = new Date(`${LEGAL.updated}T00:00:00Z`).toLocaleDateString(
    locale,
    { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" },
  );

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 pt-10 pb-4 md:pt-16">
        <h1 className="font-display text-[24px] leading-[1.1] font-medium tracking-[-0.04em] break-words hyphens-auto md:text-[40px]">
          {t("title")}
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          {t("updated", { date: updated })}
        </p>
        {PRIVACY[locale as Locale].map((section) => (
          <section
            key={section.title}
            className="mt-10 border-t border-line pt-8"
          >
            <h2 className="font-display text-lg font-medium tracking-[-0.03em] md:text-xl">
              {section.title}
            </h2>
            {section.paragraphs.map((p) => (
              <p
                key={p}
                className="mt-3 text-[15px] leading-relaxed text-text-secondary"
              >
                {fill(p)}
              </p>
            ))}
          </section>
        ))}
      </main>
    </>
  );
}
