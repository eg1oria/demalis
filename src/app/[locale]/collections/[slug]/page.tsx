import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Header } from "@/components/Header";
import { CollectionTiles } from "@/components/site/CollectionTiles";
import { PlaceCard } from "@/components/site/PlaceCard";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { catalogHref } from "@/lib/catalog/filters";
import {
  collectionsWithCounts,
  getCollectionBySlug,
} from "@/lib/catalog/collections";
import { findPlaces } from "@/lib/catalog/query";
import {
  collectionFilters,
  collectionIntro,
  collectionTitle,
} from "@/lib/collections";
import { visiblePhotos } from "@/lib/places/present";
import { photoUrl } from "@/lib/supabase/env";
import {
  absoluteUrl,
  breadcrumbJsonLd,
  jsonLdString,
  pageMetadata,
} from "@/lib/seo";

type Props = PageProps<"/[locale]/collections/[slug]">;

/** Сколько объектов показать на странице подборки. */
const MAX_PLACES = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const collection = await getCollectionBySlug(slug);
  if (!collection) return {};
  const { all } = await findPlaces(collectionFilters(collection.filters));
  const cover = all.map((p) => visiblePhotos(p)[0]).find(Boolean);
  return pageMetadata({
    locale,
    path: `/collections/${slug}`,
    title: collectionTitle(collection, locale),
    description: collectionIntro(collection, locale),
    images: cover ? [photoUrl(cover)] : [],
  });
}

export default async function CollectionPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale as Locale);

  const collection = await getCollectionBySlug(slug);
  if (!collection) notFound();

  const filters = collectionFilters(collection.filters);
  const [{ all, total }, others, t, tm, tf] = await Promise.all([
    findPlaces(filters),
    collectionsWithCounts(),
    getTranslations("Collections"),
    getTranslations("Metadata"),
    getTranslations("Format"),
  ]);
  const places = all.slice(0, MAX_PLACES);
  const title = collectionTitle(collection, locale);
  const intro = collectionIntro(collection, locale);
  const placeQuery: Record<string, string> = filters.guests
    ? { guests: String(filters.guests) }
    : {};

  const breadcrumbs = breadcrumbJsonLd([
    { name: tm("home"), url: absoluteUrl(`/${locale}`) },
    { name: title, url: absoluteUrl(`/${locale}/collections/${slug}`) },
  ]);

  return (
    <>
      <Header />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumbs) }}
      />
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-5 md:px-20">
        <nav
          aria-label="breadcrumbs"
          className="flex gap-1.5 pt-4 text-[13px] text-text-muted"
        >
          <Link href="/" className="hover:underline">
            {tm("home")}
          </Link>
          <span aria-hidden="true">/</span>
          <span>{t("title")}</span>
        </nav>
        <h1 className="mt-2 font-serif text-[32px] leading-[1.1] font-medium tracking-[-0.02em] md:text-5xl">
          {title}
        </h1>
        {intro && (
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-text-secondary md:text-lg">
            {intro}
          </p>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="text-sm text-text-muted">
            {tf("variants", { n: total })}
          </span>
          <Link
            href={catalogHref({ ...filters, when: "this" })}
            className="flex h-11 items-center rounded-full border border-line bg-surface px-4 text-sm font-semibold"
          >
            {t("openCatalog")}
          </Link>
        </div>

        {places.length === 0 ? (
          <div className="flex flex-col items-start gap-3 py-12">
            <h2 className="font-serif text-2xl font-medium">
              {t("emptyTitle")}
            </h2>
            <p className="text-text-secondary">{t("emptyText")}</p>
            <Link
              href="/catalog"
              className="flex h-12 items-center rounded-[14px] border border-line-strong px-5 font-semibold"
            >
              {t("toCatalog")}
            </Link>
          </div>
        ) : (
          <ul className="grid gap-7.5 pt-6 md:grid-cols-2 md:gap-x-6 lg:grid-cols-3">
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

        {others.length > 1 && (
          <section className="mt-12">
            <h2 className="font-serif text-[25px] leading-[1.15] font-medium tracking-[-0.015em]">
              {t("other")}
            </h2>
            <div className="mt-4">
              <CollectionTiles
                collections={others.filter((c) => c.id !== collection.id)}
              />
            </div>
          </section>
        )}
      </main>
    </>
  );
}
