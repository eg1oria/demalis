import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { Header } from "@/components/Header";
import {
  AmenityIcon,
  ClockIcon,
  InstagramIcon,
  PhoneIcon,
  PinIcon,
  PlayIcon,
  UserIcon,
  WhatsAppIcon,
} from "@/components/site/Icons";
import { PlacePhoto } from "@/components/site/PlacePhoto";
import { Gallery } from "@/components/place/Gallery";
import { SITE_NAME } from "@/config/site";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { MAX_GUESTS, parseFilters } from "@/lib/catalog/filters";
import { findSimilar, getPlaceBySlug } from "@/lib/catalog/query";
import { formatTenge, splitMinutes } from "@/lib/format";
import {
  placeAmenities,
  placeDescription,
  placeName,
  visiblePhotos,
  whatsappUrl,
} from "@/lib/places/present";
import { photoUrl } from "@/lib/supabase/env";
import { formatStay, resolveWhen } from "@/lib/when";

type Props = PageProps<"/[locale]/place/[slug]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const place = await getPlaceBySlug(slug);
  if (!place) return {};
  return {
    title: `${placeName(place, locale)} — ${SITE_NAME}`,
    description: placeDescription(place, locale)?.slice(0, 160),
  };
}

export default async function PlacePage({ params, searchParams }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale as Locale);

  const place = await getPlaceBySlug(slug);
  if (!place) notFound();

  const [t, tf, tTypes, tDir, tAmenities, currentLocale, similar] =
    await Promise.all([
      getTranslations("Place"),
      getTranslations("Format"),
      getTranslations("Types"),
      getTranslations("Directions"),
      getTranslations("Amenities"),
      getLocale(),
      findSimilar(place),
    ]);

  const name = placeName(place, currentLocale);
  const description = placeDescription(place, currentLocale);
  const photos = visiblePhotos(place).map(photoUrl);
  const amenities = placeAmenities(place);

  const drive = (minutes: number) => {
    const { h, m } = splitMinutes(minutes);
    if (h === 0) return tf("minutes", { m });
    return m === 0 ? tf("hours", { h }) : tf("hoursMinutes", { h, m });
  };

  // Гости и даты приходят из фильтров каталога и подставляются в текст WhatsApp.
  const { guests, when } = parseFilters(await searchParams);
  const stayLabel = when
    ? formatStay(resolveWhen(when, new Date()), currentLocale)
    : null;
  const waText = t("whatsappText", {
    site: SITE_NAME,
    name,
    dates: stayLabel ?? "none",
    guests: guests && guests <= MAX_GUESTS ? String(guests) : "none",
  });
  const waHref = whatsappUrl(place.whatsapp_phone, waText);
  const mapHref =
    place.lat != null && place.lng != null
      ? `https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lng}#map=13/${place.lat}/${place.lng}`
      : null;

  const h2 = "font-serif text-[22px] font-medium tracking-[-0.01em]";
  const contactClass =
    "flex h-14 items-center gap-2.5 rounded-[14px] border border-line-soft bg-surface px-3.5 text-sm font-medium";

  return (
    <>
      <Header hideOnMobile />
      <main className="mx-auto w-full max-w-3xl flex-1 md:px-6 md:pt-2">
        <Gallery urls={photos} alt={name} seed={place.id} />

        <article className="relative -mt-6 flex flex-col rounded-t-3xl bg-bg px-5 pt-6 md:mt-0 md:px-0">
          <p className="text-xs font-semibold tracking-[0.08em] text-text-muted uppercase">
            {tTypes(place.type)} · {tDir(place.direction)}
          </p>
          <h1 className="mt-2 font-serif text-[32px] leading-[1.1] font-medium tracking-[-0.02em]">
            {name}
          </h1>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-text-secondary">
            {place.drive_minutes != null && (
              <span className="flex items-center gap-1.5">
                <ClockIcon size={16} />
                {t("fromAlmaty", { time: drive(place.drive_minutes) })}
              </span>
            )}
            {place.capacity_max != null && (
              <span className="flex items-center gap-1.5">
                <UserIcon size={16} />
                {tf("upToGuests", { n: place.capacity_max })}
              </span>
            )}
          </div>

          {place.price_from != null && (
            <div className="mt-6 border-y border-line py-4.5">
              <span className="text-sm text-text-muted">
                {tf.rich("priceFromRich", {
                  price: formatTenge(place.price_from, currentLocale),
                  muted: (chunks) => <span>{chunks}</span>,
                  b: (chunks) => (
                    <span className="font-serif text-[28px] font-medium tracking-[-0.02em] text-text">
                      {chunks}
                    </span>
                  ),
                })}
              </span>
              <p className="mt-0.5 text-[13px] text-text-muted">
                {tf(`unit_${place.price_unit}`)}
              </p>
            </div>
          )}

          {amenities.length > 0 && (
            <section className="mt-8">
              <h2 className={h2}>{t("amenities")}</h2>
              <ul className="mt-3.5 grid grid-cols-2 gap-2.5 md:grid-cols-3">
                {amenities.map((amenity) => (
                  <li
                    key={amenity}
                    className="flex min-h-14 items-center gap-2.5 rounded-[14px] border border-line-soft bg-surface px-3.5 text-sm font-medium"
                  >
                    <AmenityIcon
                      amenity={amenity}
                      size={22}
                      className="flex-none text-accent"
                    />
                    {tAmenities(amenity)}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {description && (
            <section className="mt-8">
              <h2 className={h2}>{t("about")}</h2>
              <p className="mt-3 text-[15px] leading-relaxed whitespace-pre-line text-text-secondary">
                {description}
              </p>
            </section>
          )}

          <section className="mt-8">
            <h2 className={h2}>{t("contacts")}</h2>
            <div className="mt-3.5 grid gap-2.5 sm:grid-cols-2">
              <a
                href={waHref}
                target="_blank"
                rel="noopener"
                className={contactClass}
              >
                <WhatsAppIcon size={22} className="text-accent" />
                {t("writeWhatsApp")}
              </a>
              <a href={`tel:${place.whatsapp_phone}`} className={contactClass}>
                <PhoneIcon size={22} className="text-accent" />
                {t("call")}
              </a>
              {place.instagram_url && (
                <a
                  href={place.instagram_url}
                  target="_blank"
                  rel="noopener"
                  className={contactClass}
                >
                  <InstagramIcon size={22} className="text-accent" />
                  {t("instagram")}
                </a>
              )}
              {place.video_url && (
                <a
                  href={place.video_url}
                  target="_blank"
                  rel="noopener"
                  className={contactClass}
                >
                  <PlayIcon size={22} className="text-accent" />
                  {t("video")}
                </a>
              )}
            </div>
          </section>

          {(place.address_text || mapHref) && (
            <section className="mt-8">
              <h2 className={h2}>{t("location")}</h2>
              {place.address_text && (
                <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                  {place.address_text}
                </p>
              )}
              {mapHref && (
                <a
                  href={mapHref}
                  target="_blank"
                  rel="noopener"
                  className="mt-2 flex h-12 items-center justify-center gap-2 rounded-[14px] border border-line-strong text-[15px] font-semibold"
                >
                  <PinIcon size={18} />
                  {t("openMap")}
                </a>
              )}
            </section>
          )}

          {similar.length > 0 && (
            <section className="mt-8">
              <h2 className={h2}>{t("similar")}</h2>
              <ul className="mt-3.5 grid grid-cols-2 gap-3 md:grid-cols-4">
                {similar.map((other) => {
                  const otherName = placeName(other, currentLocale);
                  return (
                    <li key={other.id}>
                      <Link
                        href={`/place/${other.slug}`}
                        className="flex flex-col gap-2 text-text"
                      >
                        <div className="relative h-31 overflow-hidden rounded-2xl bg-surface-muted">
                          <PlacePhoto
                            path={visiblePhotos(other)[0]}
                            seed={other.id}
                            alt={otherName}
                            sizes="(min-width: 768px) 25vw, 50vw"
                          />
                        </div>
                        <span className="text-[15px] leading-snug font-semibold">
                          {otherName}
                        </span>
                        <span className="-mt-1 text-[13px] text-text-secondary">
                          {[
                            other.price_from != null &&
                              tf("priceFrom", {
                                price: formatTenge(
                                  other.price_from,
                                  currentLocale,
                                ),
                              }),
                            other.drive_minutes != null &&
                              drive(other.drive_minutes),
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </article>
      </main>

      {/* Нижняя панель: цена и главная кнопка — WhatsApp (заявка появится на Этапе 4). */}
      <div
        data-contact-bar
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line-soft bg-surface shadow-float"
      >
        <div className="mx-auto flex max-w-3xl items-center gap-2.5 px-4 pt-3 pb-[max(16px,env(safe-area-inset-bottom))]">
          <div className="flex min-w-0 flex-1 flex-col">
            {place.price_from != null && (
              <span className="text-base font-semibold">
                {formatTenge(place.price_from, currentLocale)}
              </span>
            )}
            <span className="truncate text-xs text-text-muted">
              {[stayLabel, guests && tf("guests", { n: guests })]
                .filter(Boolean)
                .join(" · ") || tf(`unit_${place.price_unit}`)}
            </span>
          </div>
          <a
            href={waHref}
            target="_blank"
            rel="noopener"
            className="flex h-13 flex-none items-center gap-2 rounded-2xl bg-accent px-4.5 text-[15px] font-semibold text-white"
          >
            <WhatsAppIcon size={19} />
            {t("whatsapp")}
          </a>
        </div>
      </div>
    </>
  );
}
