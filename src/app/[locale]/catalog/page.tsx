import type { Metadata } from "next";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import {
  OnlyFreeToggle,
  ViewToggle,
} from "@/components/catalog/CatalogControls";
import { CatalogMap } from "@/components/catalog/CatalogMap";
import { CatalogTopBar } from "@/components/catalog/CatalogTopBar";
import { SortSelect } from "@/components/catalog/SortSelect";
import { Header } from "@/components/Header";
import { PlaceCard } from "@/components/site/PlaceCard";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import {
  catalogHref,
  onlyFree,
  PAGE_SIZE,
  parseFilters,
} from "@/lib/catalog/filters";
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
  const now = new Date();

  const filters = parseFilters(await searchParams);
  const { places, all, total, night } = await findPlaces(filters, now);

  // «Эти выходные · 2–4 окт.» для сводки в верхней панели.
  let whenLabel: string | null = null;
  if (filters.when) {
    const stay = formatStay(resolveWhen(filters.when, now), currentLocale);
    whenLabel =
      filters.when === "this" || filters.when === "next"
        ? `${t(`when_${filters.when}`)} · ${stay}`
        : stay;
  }
  // «3 октября» — ночь, по которой считаем занятость.
  const nightLabel = night
    ? new Date(`${night}T00:00:00Z`).toLocaleDateString(currentLocale, {
        day: "numeric",
        month: "long",
        timeZone: "UTC",
      })
    : null;

  // Гости и даты пригодятся на странице объекта (календарь и текст WhatsApp).
  const placeQuery: Record<string, string> = {};
  if (filters.guests) placeQuery.guests = String(filters.guests);
  if (filters.when) placeQuery.when = filters.when;

  return (
    <>
      <Header hideOnMobile />
      <CatalogTopBar filters={filters} whenLabel={whenLabel} />

      {filters.view === "map" ? (
        <CatalogMap
          places={all}
          filters={filters}
          nightLabel={nightLabel}
          placeQuery={placeQuery}
        />
      ) : (
        <main className="mx-auto w-full max-w-[1440px] flex-1 px-5 md:px-20">
          <div className="flex items-end justify-between gap-3 pt-4.5 pb-1.5">
            <div>
              <h1 className="font-serif text-[26px] leading-[1.1] font-medium tracking-[-0.015em] whitespace-nowrap">
                {tf("variants", { n: total })}
              </h1>
              {nightLabel && (
                <p className="mt-1 text-sm text-text-muted">
                  {onlyFree(filters)
                    ? t("freeOnNight", { date: nightLabel })
                    : t("statusOnNight", { date: nightLabel })}
                </p>
              )}
            </div>
            <ViewToggle filters={filters} />
          </div>

          <div className="flex items-center justify-between gap-2 pb-2.5">
            {filters.when ? <OnlyFreeToggle filters={filters} /> : <span />}
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
              href={catalogHref({
                ...filters,
                limit: filters.limit + PAGE_SIZE,
              })}
              scroll={false}
              className="mx-auto mt-8 flex h-14 w-full max-w-md items-center justify-center rounded-2xl border border-line-strong font-semibold"
            >
              {t("showMore")}
            </Link>
          )}
        </main>
      )}
    </>
  );
}
