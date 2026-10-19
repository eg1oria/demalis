import type { Metadata } from "next";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { Header } from "@/components/Header";
import { CollectionTiles } from "@/components/site/CollectionTiles";
import { GroupBlock } from "@/components/site/GroupBlock";
import { OwnersBlock } from "@/components/site/OwnersBlock";
import { PlaceCard } from "@/components/site/PlaceCard";
import { QuickChips } from "@/components/site/QuickChips";
import { SearchCard } from "@/components/site/SearchCard";
import { SectionTitle } from "@/components/site/SectionTitle";
import { SITE_NAME } from "@/config/site";
import type { Locale } from "@/i18n/routing";
import { collectionsWithCounts } from "@/lib/catalog/collections";
import { catalogHref, EMPTY_FILTERS, rangeWhen } from "@/lib/catalog/filters";
import { findPlaces } from "@/lib/catalog/query";
import { almatyToday, toIsoDate } from "@/lib/dates";
import { holidayStay, upcomingHolidays } from "@/lib/holidays";
import { pageMetadata } from "@/lib/seo";
import { formatStay, resolveWhen } from "@/lib/when";

// Даты «этих выходных» и число вариантов меняются — пересобираем раз в 5 минут.
export const revalidate = 300;

const DEFAULT_GUESTS = 2;
/** Сколько подборок на главной (ТЗ: 3–4). */
const HOME_COLLECTIONS = 4;
/** Сколько объектов в ленте «Свободно в эту субботу». */
const FREE_STRIP = 8;

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
  const th = await getTranslations("Holidays");
  const currentLocale = await getLocale();
  const now = new Date();

  // Свободные на эти выходные: число для 2 гостей и лента без ограничения по гостям.
  const [{ total: count }, free, collections] = await Promise.all([
    findPlaces({ ...EMPTY_FILTERS, when: "this", guests: DEFAULT_GUESTS }, now),
    findPlaces({ ...EMPTY_FILTERS, when: "this" }, now),
    collectionsWithCounts(HOME_COLLECTIONS),
  ]);
  const freePlaces = free.all.slice(0, FREE_STRIP);

  const container = "mx-auto w-full max-w-[1440px] px-5 md:px-10 lg:px-20";

  return (
    <>
      <Header />
      <main className="flex flex-col">
        <section className={`${container} pt-10 md:pt-20`}>
          <p className="text-[11px] font-medium tracking-[0.14em] text-text-muted uppercase">
            {t("eyebrow")}
          </p>
          <h1 className="mt-4 font-display text-[34px] leading-[1.04] font-medium tracking-[-0.045em] md:text-[64px] lg:text-[80px]">
            {t("titleLine1")}
            <br />
            <span className="text-text-muted">{t("titleLine2")}</span>
          </h1>
          <div className="mt-5 flex flex-col gap-3 md:mt-8 md:flex-row md:items-end md:justify-between">
            <p className="max-w-lg text-base leading-relaxed text-text-secondary md:text-lg">
              {t("lead")}
            </p>
            <p className="hidden items-center gap-2 text-sm text-text-muted md:flex">
              <span className="size-[7px] rounded-full bg-status-free" />
              {t("ownersUpdate")}
            </p>
          </div>
        </section>

        <section className={`${container} mt-8 md:mt-12`}>
          <SearchCard
            thisLabel={formatStay(resolveWhen("this", now), currentLocale)}
            nextLabel={formatStay(resolveWhen("next", now), currentLocale)}
            weekdaysLabel={formatStay(
              resolveWhen("weekdays", now),
              currentLocale,
            )}
            holidays={upcomingHolidays(now).map((h) => {
              const stay = holidayStay(h);
              return {
                when: rangeWhen(stay.checkIn, stay.checkOut)!,
                label: `${th(h.id)} · ${formatStay(stay, currentLocale)}`,
              };
            })}
            initialGuests={DEFAULT_GUESTS}
            initialCount={count ?? 0}
            today={toIsoDate(almatyToday(now))}
          />
          <div className="mt-4">
            <QuickChips />
          </div>
        </section>

        {freePlaces.length > 0 && (
          <section className={`${container} mt-16 md:mt-24`}>
            <SectionTitle
              href={catalogHref({ when: "this" })}
              linkLabel={t("all")}
            >
              {t("freeTitle")}
            </SectionTitle>
            <ul className="no-scrollbar -mx-5 mt-5 flex snap-x gap-4 overflow-x-auto px-5 md:mx-0 md:mt-7 md:grid md:grid-cols-3 md:gap-x-6 md:gap-y-10 md:overflow-visible md:px-0 lg:grid-cols-4">
              {freePlaces.map((place) => (
                <li
                  key={place.id}
                  className="w-[78%] flex-none snap-start md:w-auto"
                >
                  <PlaceCard place={place} query={{ when: "this" }} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {collections.length > 0 && (
          <section
            id="collections"
            className={`${container} mt-16 scroll-mt-4 md:mt-24`}
          >
            <SectionTitle href="/collections" linkLabel={t("all")}>
              {tc("title")}
            </SectionTitle>
            <div className="mt-5 md:mt-7">
              <CollectionTiles collections={collections} />
            </div>
          </section>
        )}

        <section className={`${container} mt-16 md:mt-24`}>
          <GroupBlock today={toIsoDate(almatyToday(now))} />
        </section>

        <section className={`${container} mt-16 md:mt-24`}>
          <OwnersBlock />
        </section>
      </main>
    </>
  );
}
