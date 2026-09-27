import type { Metadata } from "next";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { Header } from "@/components/Header";
import { CollectionTiles } from "@/components/site/CollectionTiles";
import { Landscape } from "@/components/site/Landscape";
import { OwnersBlock } from "@/components/site/OwnersBlock";
import { QuickChips } from "@/components/site/QuickChips";
import { SearchCard } from "@/components/site/SearchCard";
import { SITE_NAME } from "@/config/site";
import type { Locale } from "@/i18n/routing";
import { collectionsWithCounts } from "@/lib/catalog/collections";
import { EMPTY_FILTERS } from "@/lib/catalog/filters";
import { findPlaces } from "@/lib/catalog/query";
import { almatyToday, toIsoDate } from "@/lib/dates";
import { pageMetadata } from "@/lib/seo";
import { formatStay, resolveWhen } from "@/lib/when";

// Даты «этих выходных» и число вариантов меняются — пересобираем раз в 5 минут.
export const revalidate = 300;

const DEFAULT_GUESTS = 2;
/** Сколько подборок на главной (ТЗ: 3–4). */
const HOME_COLLECTIONS = 4;

export async function generateMetadata({
  params,
}: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "Metadata",
  });
  return pageMetadata({
    locale,
    path: "",
    title: `${SITE_NAME} — ${t("homeTitle")}`,
    absoluteTitle: true,
    description: t("description"),
  });
}

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("HomePage");
  const tc = await getTranslations("Collections");
  const currentLocale = await getLocale();
  const now = new Date();

  // Столько свободных вариантов на эти выходные для 2 гостей.
  const [{ total: count }, collections] = await Promise.all([
    findPlaces({ ...EMPTY_FILTERS, when: "this", guests: DEFAULT_GUESTS }, now),
    collectionsWithCounts(HOME_COLLECTIONS),
  ]);

  return (
    <>
      <Header />
      <main className="mx-auto flex w-full max-w-[1440px] flex-col md:px-20">
        <section className="grid items-center gap-6 px-5 pt-4 md:grid-cols-2 md:gap-16 md:px-0 md:pt-6">
          <div>
            <p className="text-xs font-semibold tracking-[0.1em] text-text-muted uppercase">
              {t("eyebrow")}
            </p>
            <h1 className="mt-3 font-serif text-[38px] leading-[1.06] font-medium tracking-[-0.025em] md:text-7xl">
              {t("titleLine1")}
              <br />
              <em className="text-accent">{t("titleLine2")}</em>
            </h1>
            <p className="mt-3.5 max-w-xl text-base leading-normal text-text-secondary md:mt-6 md:text-xl">
              {t("lead")}
            </p>
            <p className="mt-6 hidden items-center gap-2 text-sm text-text-muted md:flex">
              <span className="size-[7px] rounded-full bg-status-free" />
              {t("ownersUpdate")}
            </p>
          </div>
          <div className="relative hidden aspect-[4/3] overflow-hidden rounded-3xl md:block">
            <Landscape seed="home-hero-3" />
          </div>
        </section>

        <section className="mx-4 mt-6 md:mx-0 md:mt-10">
          <SearchCard
            thisLabel={formatStay(resolveWhen("this", now), currentLocale)}
            nextLabel={formatStay(resolveWhen("next", now), currentLocale)}
            initialGuests={DEFAULT_GUESTS}
            initialCount={count ?? 0}
            today={toIsoDate(almatyToday(now))}
          />
        </section>

        <section className="mt-5 px-4 md:px-0">
          <QuickChips />
        </section>

        {collections.length > 0 && (
          <section
            id="collections"
            className="mt-11 scroll-mt-4 px-4 md:mt-20 md:px-0"
          >
            <h2 className="mx-1 font-serif text-[25px] leading-[1.15] font-medium tracking-[-0.015em] md:mx-0 md:text-[38px] md:leading-[1.1] md:tracking-[-0.02em]">
              {tc("title")}
            </h2>
            <div className="mt-4 md:mt-7">
              <CollectionTiles collections={collections} />
            </div>
          </section>
        )}

        <section className="mx-4 mt-11 md:mx-0 md:mt-20">
          <OwnersBlock />
        </section>
      </main>
    </>
  );
}
