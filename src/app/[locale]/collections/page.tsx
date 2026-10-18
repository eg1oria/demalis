import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Header } from "@/components/Header";
import { CollectionTiles } from "@/components/site/CollectionTiles";
import type { Locale } from "@/i18n/routing";
import { collectionsWithCounts } from "@/lib/catalog/collections";
import { pageMetadata } from "@/lib/seo";

// Число объектов в подборках меняется вместе с каталогом.
export const revalidate = 300;

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/collections">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "Collections",
  });
  return pageMetadata({
    locale,
    path: "/collections",
    title: t("title"),
    description: t("indexDescription"),
  });
}

/** Все опубликованные подборки. */
export default async function CollectionsPage({
  params,
}: PageProps<"/[locale]/collections">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const [t, collections] = await Promise.all([
    getTranslations("Collections"),
    collectionsWithCounts(),
  ]);

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-5 pt-10 md:px-10 md:pt-16 lg:px-20">
        <h1 className="font-display text-[28px] leading-[1.08] font-medium tracking-[-0.04em] md:text-[48px]">
          {t("title")}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-text-secondary md:text-lg">
          {t("indexDescription")}
        </p>
        <div className="mt-8 md:mt-12">
          {collections.length > 0 ? (
            <CollectionTiles collections={collections} />
          ) : (
            <p className="text-text-secondary">{t("emptyText")}</p>
          )}
        </div>
      </main>
    </>
  );
}
