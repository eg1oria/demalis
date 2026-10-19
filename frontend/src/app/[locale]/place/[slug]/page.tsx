import type { Metadata } from "next";
import type { ReactNode } from "react";
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
import { FavoriteButton } from "@/components/site/FavoriteButton";
import { PlaceCard } from "@/components/site/PlaceCard";
import { SectionTitle } from "@/components/site/SectionTitle";
import { StatusDot } from "@/components/site/StatusBadge";
import { TrackedLink } from "@/components/site/TrackedLink";
import { VerifiedBadge } from "@/components/site/VerifiedBadge";
import { AvailabilityCalendar } from "@/components/place/AvailabilityCalendar";
import { Description } from "@/components/place/Description";
import { Gallery } from "@/components/place/Gallery";
import { LeadForm } from "@/components/place/LeadForm";
import { ShareButton } from "@/components/place/ShareButton";
import { StatusBlock } from "@/components/place/StatusBlock";
import { TrackedPhoneLink } from "@/components/place/TrackedPhoneLink";
import { ViewTracker } from "@/components/place/ViewTracker";
import type { Locale } from "@/i18n/routing";
import { parseFilters } from "@/lib/catalog/filters";
import {
  combineStatuses,
  daysSince,
  type DisplayStatus,
  displayStatus,
} from "@/lib/availability";
import {
  findSimilar,
  getPlaceAvailability,
  getPlaceBySlug,
  placeStatus,
  statusesForStay,
  stayIndex,
} from "@/lib/catalog/query";
import { stayEstimate, stayStatus } from "@/lib/stay";
import { almatyToday, nextDays, toIsoDate } from "@/lib/dates";
import { goHref } from "@/lib/go";
import { planFeatures } from "@/lib/plans";
import { formatDayMonth, formatTenge, splitMinutes } from "@/lib/format";
import {
  placeAmenities,
  placeDescription,
  placeName,
  visiblePhotos,
} from "@/lib/places/present";
import { photoUrl } from "@/lib/api/photos";
import {
  absoluteUrl,
  breadcrumbJsonLd,
  jsonLdString,
  lodgingJsonLd,
  pageMetadata,
} from "@/lib/seo";
import { formatStay, resolveWhen } from "@/lib/when";

type Props = PageProps<"/[locale]/place/[slug]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const place = await getPlaceBySlug(slug);
  if (!place) return {};
  const [tm, tTypes, tDir, tf] = await Promise.all([
    getTranslations({ locale: locale as Locale, namespace: "Metadata" }),
    getTranslations({ locale: locale as Locale, namespace: "Types" }),
    getTranslations({ locale: locale as Locale, namespace: "Directions" }),
    getTranslations({ locale: locale as Locale, namespace: "Format" }),
  ]);
  const formatDrive = (minutes: number) => {
    const { h, m } = splitMinutes(minutes);
    if (h === 0) return tf("minutes", { m });
    return m === 0 ? tf("hours", { h }) : tf("hoursMinutes", { h, m });
  };
  // Без описания — короткая сводка: тип, направление, дорога, цена.
  const summary = tm("placeDescription", {
    type: tTypes(place.type),
    direction: tDir(place.direction),
    drive: place.drive_minutes != null ? formatDrive(place.drive_minutes) : "—",
    price:
      place.price_from != null
        ? `${tf("priceFrom", { price: formatTenge(place.price_from, locale) })} ${tf("perNight")}. `
        : "",
  });
  return pageMetadata({
    locale,
    path: `/place/${place.slug}`,
    title: placeName(place, locale),
    description: placeDescription(place, locale) ?? summary,
    images: visiblePhotos(
      place,
      planFeatures(place, toIsoDate(almatyToday(new Date()))).photos,
    ).map(photoUrl),
  });
}

export default async function PlacePage({ params, searchParams }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale as Locale);

  const place = await getPlaceBySlug(slug);
  if (!place) notFound();

  const now = new Date();
  const calendarDays = nextDays(now, 30);
  const today = calendarDays[0];
  // Что даёт тариф: фото, видео, календарь, «Проверено» (Этап 8).
  const features = planFeatures(place, today);
  // Гости и даты приходят из фильтров каталога: календарь, блок статуса, текст WhatsApp.
  const { guests, when } = parseFilters(await searchParams);
  const stay = when ? resolveWhen(when, now) : null;
  // Без выбранных дат отвечаем про эти выходные (пт и сб, Этап 14).
  const nights = (stay ?? resolveWhen("this", now)).nights;
  const first = nights[0];
  const last = nights[nights.length - 1];

  const [
    t,
    tf,
    tTypes,
    tDir,
    tAmenities,
    currentLocale,
    similar,
    availability,
    index,
  ] = await Promise.all([
    getTranslations("Place"),
    getTranslations("Format"),
    getTranslations("Types"),
    getTranslations("Directions"),
    getTranslations("Amenities"),
    getLocale(),
    findSimilar(place),
    getPlaceAvailability(
      place.id,
      calendarDays[0] < first ? calendarDays[0] : first,
      calendarDays[calendarDays.length - 1] > last
        ? calendarDays[calendarDays.length - 1]
        : last,
    ),
    stayIndex(nights, now, place.id),
  ]);
  const similarStatuses = await statusesForStay(nights, now);

  // Без календаря в тарифе гость видит только «Уточняйте наличие».
  const dayStatus = (date: string): DisplayStatus =>
    features.availability
      ? displayStatus(availability.days[date], availability.lastUpdatedAt, now)
      : "unknown";
  const calendarStatuses = Object.fromEntries(
    calendarDays.map((d) => [d, dayStatus(d)]),
  );
  // Все ночи поездки (и места в домиках на гостей) — худший статус.
  const nightStatus: DisplayStatus = features.availability
    ? stayStatus(index, place.id, nights, guests)
    : "unknown";
  const estimate =
    nightStatus !== "full" ? stayEstimate(place, index, nights, guests) : null;
  const updatedDays = availability.lastUpdatedAt
    ? daysSince(availability.lastUpdatedAt, now)
    : null;
  const stale = nightStatus === "stale" || (updatedDays ?? 0) > 7;
  // Статус домика на ночи поездки (свежесть — как у объекта).
  const unitStatus = (unitId: string): DisplayStatus =>
    features.availability
      ? combineStatuses(
          nights.map((n) =>
            displayStatus(
              index.units.get(unitId)?.get(n)?.status,
              availability.lastUpdatedAt,
              now,
            ),
          ),
        )
      : "unknown";

  const name = placeName(place, currentLocale);
  const description = placeDescription(place, currentLocale);
  const photos = visiblePhotos(place, features.photos).map(photoUrl);
  const amenities = placeAmenities(place);

  const drive = (minutes: number) => {
    const { h, m } = splitMinutes(minutes);
    if (h === 0) return tf("minutes", { m });
    return m === 0 ? tf("hours", { h }) : tf("hoursMinutes", { h, m });
  };

  const stayLabel = stay ? formatStay(stay, currentLocale) : null;
  const nightsLabel = formatStay(
    stay ?? resolveWhen("this", now),
    currentLocale,
  );
  const tStatus = await getTranslations("Status");
  const tCalendar = await getTranslations("Calendar");
  const statusTitle =
    nightStatus === "stale" || nightStatus === "unknown"
      ? tStatus(nightStatus)
      : !when || when === "this"
        ? t("statusThisWeekend", { status: tStatus(nightStatus) })
        : t("statusOnNight", {
            status: tStatus(nightStatus),
            date: nightsLabel,
          });
  const statusSubtitle =
    nightStatus === "stale" || nightStatus === "unknown"
      ? t("statusAsk")
      : t("statusUpdated", {
          date: nightsLabel,
          ago: t("ago", { days: updatedDays ?? 0 }),
        });
  // Клики идут через /api/go/...: маршрут записывает событие и перенаправляет.
  const waHref = goHref("whatsapp", place.id, {
    dates: stay,
    guests,
    locale: currentLocale,
  });
  const tLead = await getTranslations("LeadForm");
  const tm = await getTranslations("Metadata");

  const placeUrl = absoluteUrl(`/${currentLocale}/place/${place.slug}`);
  const structuredData = [
    lodgingJsonLd({
      name,
      description,
      url: placeUrl,
      images: photos,
      address: place.address_text,
      locality: place.direction === "drugoe" ? null : tDir(place.direction),
      region: tm("region"),
      lat: place.lat,
      lng: place.lng,
      phone: place.whatsapp_phone,
      priceRange:
        place.price_from != null
          ? tf("priceFrom", {
              price: formatTenge(place.price_from, currentLocale),
            })
          : null,
      amenities: amenities.map((a) => tAmenities(a)),
      petsAllowed: place.pets_allowed,
    }),
    breadcrumbJsonLd([
      { name: tm("home"), url: absoluteUrl(`/${currentLocale}`) },
      {
        name: tm("catalogTitle"),
        url: absoluteUrl(`/${currentLocale}/catalog`),
      },
      { name, url: placeUrl },
    ]),
  ];
  const mapHref =
    place.lat != null && place.lng != null
      ? `https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lng}#map=13/${place.lat}/${place.lng}`
      : null;

  const h2 =
    "font-display text-lg font-medium tracking-[-0.03em] md:text-[22px]";
  const section = "border-t border-line pt-8 mt-8 md:pt-10 md:mt-10";
  const contactClass =
    "flex h-12 items-center gap-2.5 rounded-[10px] border border-line px-3.5 text-sm transition-colors hover:border-text";

  const bigPrice = (chunks: ReactNode) => (
    <span className="tabular font-display text-[26px] font-medium tracking-[-0.04em] text-text">
      {chunks}
    </span>
  );
  const dayPrices = (p: {
    price_weekday: number | null;
    price_weekend: number | null;
    price_holiday: number | null;
  }) =>
    (
      [
        ["priceWeekday", p.price_weekday],
        ["priceWeekend", p.price_weekend],
        ["priceHoliday", p.price_holiday],
      ] as const
    )
      .filter(([, price]) => price != null)
      .map(([key, price]) => `${t(key)} ${formatTenge(price!, currentLocale)}`)
      .join(" · ");
  const placeDayPrices = dayPrices(place);
  const estimateText = (e: NonNullable<typeof estimate>, b = bigPrice) =>
    tf.rich(e.nights === 1 ? "nightPriceRich" : "stayPriceRich", {
      date: formatDayMonth(e.firstNight),
      n: e.nights,
      price: formatTenge(e.total, currentLocale),
      muted: (chunks) => <span>{chunks}</span>,
      b,
    });

  // С датами — сумма за все ночи; без них — «от» и цены по дням.
  const priceBlock = (place.price_from != null || estimate) && (
    <div>
      <span className="text-sm text-text-muted">
        {estimate
          ? estimateText(estimate)
          : tf.rich("priceFromRich", {
              price: formatTenge(place.price_from!, currentLocale),
              muted: (chunks) => <span>{chunks}</span>,
              b: bigPrice,
            })}
        {estimate?.perPersonUnknownGuests && ` ${tf("perPerson")}`}
      </span>
      <p className="mt-0.5 text-[13px] text-text-muted">
        {estimate && place.price_from != null
          ? `${tf("priceFrom", { price: formatTenge(place.price_from, currentLocale) })} · `
          : ""}
        {tf(`unit_${place.price_unit}`)}
      </p>
      {placeDayPrices && (
        <p className="mt-1 text-[13px] text-text-muted">{placeDayPrices}</p>
      )}
      <p className="mt-1 text-[13px] text-text-muted">{t("priceNote")}</p>
    </div>
  );

  return (
    <>
      <Header hideOnMobile />
      <main className="mx-auto w-full max-w-[1440px] flex-1 md:px-10 md:pt-8 lg:px-20">
        <Gallery
          urls={photos}
          alt={name}
          actions={
            <>
              <ShareButton title={name} />
              <FavoriteButton placeId={place.id} variant="photo" />
            </>
          }
        />

        <div className="relative -mt-5 rounded-t-2xl bg-bg px-5 pt-6 md:mt-0 md:px-0 md:pt-8 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-16 lg:pt-10">
          <article className="flex min-w-0 flex-col">
            <p className="text-[11px] font-medium tracking-[0.14em] text-text-muted uppercase">
              {tTypes(place.type)} · {tDir(place.direction)}
            </p>
            <h1 className="mt-3 font-display text-[26px] leading-[1.1] font-medium tracking-[-0.04em] md:text-[40px]">
              {name}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-text-secondary">
              {features.verified && <VerifiedBadge onPhoto={false} link />}
              {place.drive_minutes != null && (
                <span className="flex items-center gap-1.5">
                  <ClockIcon size={16} className="text-text-muted" />
                  {t("fromAlmaty", { time: drive(place.drive_minutes) })}
                </span>
              )}
              {place.capacity_max != null && (
                <span className="flex items-center gap-1.5">
                  <UserIcon size={16} className="text-text-muted" />
                  {tf("upToGuests", { n: place.capacity_max })}
                </span>
              )}
            </div>

            {/* На десктопе статус и цена — в блоке справа. */}
            <div className="mt-6 lg:hidden">
              <StatusBlock
                status={nightStatus}
                title={statusTitle}
                subtitle={statusSubtitle}
              />
            </div>
            {priceBlock && (
              <div className="mt-6 border-t border-line pt-5 lg:hidden">
                {priceBlock}
              </div>
            )}

            {amenities.length > 0 && (
              <section className={section}>
                <h2 className={h2}>{t("amenities")}</h2>
                <ul className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-3">
                  {amenities.map((amenity) => (
                    <li
                      key={amenity}
                      className="flex items-center gap-3 text-[15px]"
                    >
                      <AmenityIcon
                        amenity={amenity}
                        size={20}
                        className="flex-none text-text-muted"
                      />
                      {tAmenities(amenity)}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {place.units.length > 0 && (
              <section className={section}>
                <h2 className={h2}>{t("units")}</h2>
                <p className="mt-2 text-sm text-text-secondary">
                  {t("unitsNote")}
                </p>
                <ul className="mt-5 divide-y divide-line border-y border-line">
                  {place.units.map((unit) => {
                    const status = unitStatus(unit.id);
                    const price =
                      status !== "full"
                        ? stayEstimate(
                            { ...place, units: [unit] },
                            index,
                            nights,
                            guests,
                          )
                        : null;
                    const prices = dayPrices(unit);
                    return (
                      <li
                        key={unit.id}
                        className="flex items-start justify-between gap-4 py-4"
                      >
                        <div className="min-w-0">
                          <p className="font-medium">
                            {(currentLocale === "kk" && unit.name_kk?.trim()) ||
                              unit.name_ru}
                          </p>
                          <p className="mt-0.5 text-sm text-text-muted">
                            {tf("upToGuests", { n: unit.capacity })}
                            {prices && ` · ${prices}`}
                          </p>
                        </div>
                        <div className="flex flex-none flex-col items-end gap-1.5">
                          {features.availability && (
                            <span className="flex items-center gap-1.5 text-[13px] text-text-secondary">
                              <StatusDot status={status} />
                              {tStatus(status)}
                            </span>
                          )}
                          {price && (
                            <span className="tabular text-[15px] text-text-muted">
                              {estimateText(price, (chunks) => (
                                <span className="font-medium text-text">
                                  {chunks}
                                </span>
                              ))}
                            </span>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            {description && (
              <section className={section}>
                <h2 className={h2}>{t("about")}</h2>
                <div className="mt-4">
                  <Description text={description} />
                </div>
              </section>
            )}

            {features.availability && (
              <section className={section}>
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className={h2}>{tCalendar("title")}</h2>
                  <span className="text-[13px] text-text-muted">
                    {updatedDays === null
                      ? tCalendar("never")
                      : tCalendar("updated", { days: updatedDays })}
                  </span>
                </div>
                {stale && updatedDays !== null && (
                  <p className="mt-2 text-sm text-text-secondary">
                    {tCalendar("staleNote")}
                  </p>
                )}
                <div className="mt-5 md:max-w-md">
                  <AvailabilityCalendar
                    days={calendarDays}
                    statuses={calendarStatuses}
                    selected={stay?.nights ?? []}
                  />
                </div>
              </section>
            )}

            <section id="lead" className={`${section} scroll-mt-6`}>
              <h2 className={h2}>{tLead("title")}</h2>
              <p className="mt-2 text-sm text-text-secondary">
                {tLead("lead")}
              </p>
              <div className="mt-5">
                <LeadForm
                  placeId={place.id}
                  today={calendarDays[0]}
                  checkIn={stay?.checkIn}
                  checkOut={stay?.checkOut}
                  guests={guests}
                />
              </div>
            </section>

            <section className={section}>
              <h2 className={h2}>{t("contacts")}</h2>
              <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
                <TrackedLink
                  event="click_whatsapp"
                  params={{ place_id: place.id }}
                  href={waHref}
                  target="_blank"
                  rel="noopener nofollow"
                  className={contactClass}
                >
                  <WhatsAppIcon size={20} className="text-text-muted" />
                  {t("writeWhatsApp")}
                </TrackedLink>
                <TrackedPhoneLink
                  placeId={place.id}
                  phone={place.whatsapp_phone}
                  className={contactClass}
                >
                  <PhoneIcon size={20} className="text-text-muted" />
                  {t("call")}
                </TrackedPhoneLink>
                {place.instagram_url && (
                  <TrackedLink
                    event="click_instagram"
                    params={{ place_id: place.id }}
                    href={goHref("instagram", place.id)}
                    target="_blank"
                    rel="noopener nofollow"
                    className={contactClass}
                  >
                    <InstagramIcon size={20} className="text-text-muted" />
                    {t("instagram")}
                  </TrackedLink>
                )}
                {features.video && place.video_url && (
                  <a
                    href={place.video_url}
                    target="_blank"
                    rel="noopener"
                    className={contactClass}
                  >
                    <PlayIcon size={20} className="text-text-muted" />
                    {t("video")}
                  </a>
                )}
              </div>
            </section>

            {(place.address_text || mapHref) && (
              <section className={section}>
                <h2 className={h2}>{t("location")}</h2>
                {place.address_text && (
                  <p className="mt-4 text-[15px] leading-relaxed text-text-secondary">
                    {place.address_text}
                  </p>
                )}
                {mapHref && (
                  <a
                    href={mapHref}
                    target="_blank"
                    rel="noopener"
                    className="mt-4 flex h-11 w-fit items-center gap-2 rounded-full border border-text px-4.5 text-sm transition-colors hover:bg-text hover:text-white"
                  >
                    <PinIcon size={16} />
                    {t("openMap")}
                  </a>
                )}
              </section>
            )}
          </article>

          {/* Десктоп: цена, статус и связь всегда под рукой. */}
          <aside className="hidden lg:block">
            <div className="sticky top-8 flex flex-col gap-5 rounded-2xl border border-line bg-surface p-6">
              {priceBlock}
              <div className="flex items-start gap-2.5 border-y border-line py-4">
                <span className="mt-1.5 flex">
                  <StatusDot status={nightStatus} />
                </span>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[15px] font-medium">{statusTitle}</span>
                  <span className="text-[13px] text-text-muted">
                    {statusSubtitle}
                  </span>
                </div>
              </div>
              {(stayLabel || guests) && (
                <p className="-mt-1 text-sm text-text-secondary">
                  {[stayLabel, guests && tf("guests", { n: guests })]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
              <div className="flex flex-col gap-2.5">
                <TrackedLink
                  event="click_whatsapp"
                  params={{ place_id: place.id }}
                  href={waHref}
                  target="_blank"
                  rel="noopener nofollow"
                  className="flex h-12 items-center justify-center gap-2 rounded-[10px] bg-accent text-[15px] font-medium text-white transition-opacity hover:opacity-90"
                >
                  <WhatsAppIcon size={18} />
                  {t("writeWhatsApp")}
                </TrackedLink>
                <a
                  href="#lead"
                  className="flex h-12 items-center justify-center rounded-[10px] border border-text text-[15px] transition-colors hover:bg-text hover:text-white"
                >
                  {tLead("title")}
                </a>
                <TrackedPhoneLink
                  placeId={place.id}
                  phone={place.whatsapp_phone}
                  className="flex h-10 items-center justify-center gap-2 text-sm text-text-secondary transition-colors hover:text-text"
                >
                  <PhoneIcon size={16} />
                  {t("call")}
                </TrackedPhoneLink>
              </div>
              <div className="flex gap-2 border-t border-line pt-5">
                <FavoriteButton placeId={place.id} variant="plain" />
                <ShareButton title={name} variant="plain" />
              </div>
            </div>
          </aside>
        </div>

        {similar.length > 0 && (
          <section className="mt-14 border-t border-line px-5 pt-10 md:mt-20 md:px-0">
            <SectionTitle>{t("similar")}</SectionTitle>
            <ul className="no-scrollbar -mx-5 mt-6 flex snap-x gap-4 overflow-x-auto px-5 md:mx-0 md:grid md:grid-cols-4 md:gap-6 md:overflow-visible md:px-0">
              {similar.map((other) => (
                <li
                  key={other.id}
                  className="w-[70%] flex-none snap-start md:w-auto"
                >
                  <PlaceCard
                    place={{
                      ...other,
                      status: placeStatus(other, similarStatuses, today),
                    }}
                  />
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      <ViewTracker placeId={place.id} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(structuredData) }}
      />

      {/* Нижняя панель на телефоне и планшете: цена, заявка и главная кнопка — WhatsApp. */}
      <div
        data-contact-bar
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface lg:hidden"
      >
        <div className="mx-auto flex max-w-3xl items-center gap-2.5 px-4 pt-3 pb-[max(16px,env(safe-area-inset-bottom))]">
          <div className="flex min-w-0 flex-1 flex-col">
            {place.price_from != null && (
              <span className="tabular text-base font-medium">
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
            href="#lead"
            className="flex h-12 flex-none items-center rounded-[10px] border border-line px-4 text-[15px]"
          >
            {tLead("button")}
          </a>
          <TrackedLink
            event="click_whatsapp"
            params={{ place_id: place.id }}
            href={waHref}
            target="_blank"
            rel="noopener nofollow"
            className="flex h-12 flex-none items-center gap-2 rounded-[10px] bg-accent px-4.5 text-[15px] font-medium text-white"
          >
            <WhatsAppIcon size={18} />
            {t("whatsapp")}
          </TrackedLink>
        </div>
      </div>
    </>
  );
}
