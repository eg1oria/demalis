import type { Metadata } from "next";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { CatalogTopBar } from "@/components/catalog/CatalogTopBar";
import { SortSelect } from "@/components/catalog/SortSelect";
import { Header } from "@/components/Header";
import { PlaceCard } from "@/components/site/PlaceCard";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { catalogHref, PAGE_SIZE, parseFilters } from "@/lib/catalog/filters";
import { findPlaces } from "@/lib/catalog/query";
import { formatStay, resolveWhen } from "@/lib/when";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/catalog">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "Metadata",
  });
  return { title: t("catalogTitle") };
}

export default async function CatalogPage({
  params,
  searchParams,
}: PageProps<"/[locale]/catalog">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("Catalog");
  const tf = await getTranslations("Format");
  const currentLocale = await getLocale();

  const filters = parseFilters(await searchParams);
  const { places, total } = await findPlaces(filters);

  // Параметры, которые пригодятся на странице объекта (гости и даты для WhatsApp).
  const placeQuery: Record<string, string> = {};
  if (filters.guests) placeQuery.guests = String(filters.guests);
  if (filters.when) placeQuery.when = filters.when;

  return (
    <>
      <Header hideOnMobile />
      <CatalogTopBar
        filters={filters}
        whenLabel={
          filters.when
            ? formatStay(resolveWhen(filters.when, new Date()), currentLocale)
            : null
        }
      />
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-5 md:px-20">
        <div className="flex items-end justify-between gap-3 pt-4.5 pb-2">
          <h1 className="font-serif text-[26px] leading-[1.1] font-medium tracking-[-0.015em]">
            {tf("variants", { n: total })}
          </h1>
          <SortSelect filters={filters} />
        </div>

        {places.length === 0 ? (
          <div className="flex flex-col items-start gap-3 py-16">
            <h2 className="font-serif text-2xl font-medium">
              {t("emptyTitle")}
            </h2>
            <p className="text-text-secondary">{t("emptyText")}</p>
            <Link
              href="/catalog"
              className="flex h-12 items-center rounded-[14px] border border-line-strong px-5 font-semibold"
            >
              {t("reset")}
            </Link>
          </div>
        ) : (
          <ul className="grid gap-7.5 pt-1.5 md:grid-cols-2 md:gap-x-6 lg:grid-cols-3">
            {places.map((place, i) => (
              <li key={place.id}>
                <PlaceCard
                  place={place}
                  query={placeQuery}
                  priority={i === 0}
                />
              </li>
            ))}
          </ul>
        )}

        {places.length < total && (
          <Link
            href={catalogHref({ ...filters, limit: filters.limit + PAGE_SIZE })}
            scroll={false}
            className="mx-auto mt-8 flex h-14 w-full max-w-md items-center justify-center rounded-2xl border border-line-strong font-semibold"
          >
            {t("showMore")}
          </Link>
        )}
      </main>
    </>
  );
}
