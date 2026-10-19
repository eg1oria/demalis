import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Header } from "@/components/Header";
import { FavoritesGrid } from "@/components/site/FavoritesGrid";
import { ArrowRightIcon } from "@/components/site/Icons";
import { PlaceCard } from "@/components/site/PlaceCard";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { findPlacesByIds } from "@/lib/catalog/query";
import { FAVORITES_COOKIE, parseFavorites } from "@/lib/favorites";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/favorites">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "Favorites",
  });
  // Личный список — поисковикам не нужен.
  return {
    title: t("title"),
    description: t("description"),
    robots: { index: false, follow: true },
  };
}

/** Избранное: id объектов из cookie браузера (src/lib/favorites.ts). */
export default async function FavoritesPage({
  params,
}: PageProps<"/[locale]/favorites">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const ids = parseFavorites((await cookies()).get(FAVORITES_COOKIE)?.value);
  const [t, places] = await Promise.all([
    getTranslations("Favorites"),
    findPlacesByIds(ids),
  ]);

  const empty = (
    <div className="flex flex-col items-start gap-3 py-10">
      <h2 className="font-display text-xl font-medium tracking-[-0.03em]">
        {t("emptyTitle")}
      </h2>
      <p className="max-w-md text-text-secondary">{t("emptyText")}</p>
      <Link
        href="/catalog"
        className="mt-2 flex h-11 items-center gap-2 rounded-[10px] bg-text px-5 text-[15px] font-medium text-white"
      >
        {t("toCatalog")}
        <ArrowRightIcon size={18} />
      </Link>
    </div>
  );

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-5 pt-10 md:px-10 md:pt-16 lg:px-20">
        <h1 className="font-display text-[28px] leading-[1.08] font-medium tracking-[-0.04em] md:text-[48px]">
          {t("title")}
        </h1>
        {places.length > 0 && (
          <p className="mt-3 text-sm text-text-muted">{t("note")}</p>
        )}
        <div className="mt-8 md:mt-12">
          <FavoritesGrid
            empty={empty}
            items={places.map((place) => ({
              id: place.id,
              card: <PlaceCard place={place} />,
            }))}
          />
        </div>
      </main>
    </>
  );
}
