import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { PlaceCardData } from "@/lib/catalog/query";
import { placeAmenities, placeName, visiblePhotos } from "@/lib/places/present";
import { CardPhotos } from "./CardPhotos";
import { FavoriteButton } from "./FavoriteButton";
import { StatusBadge } from "./StatusBadge";
import { VerifiedBadge } from "./VerifiedBadge";
import { useFormat } from "./useFormat";

/** Сколько фото листается в карточке (лимит бесплатного тарифа). */
const CARD_PHOTOS = 5;

/** Карточка объекта в каталоге: фото, название и цена, одна строка деталей. */
export function PlaceCard({
  place,
  query,
  priority = false,
}: {
  place: PlaceCardData;
  query?: Record<string, string>;
  priority?: boolean;
}) {
  const locale = useLocale();
  const tTypes = useTranslations("Types");
  const tAmenities = useTranslations("Amenities");
  const tPlans = useTranslations("Plans");
  const f = useFormat();
  const name = placeName(place, locale);
  const href = { pathname: `/place/${place.slug}`, query };

  const details = [
    tTypes(place.type),
    place.drive_minutes != null && f.drive(place.drive_minutes),
    place.capacity_max != null && f.t("upTo", { n: place.capacity_max }),
  ].filter(Boolean);
  const amenities = placeAmenities(place, 3).map((a) => tAmenities(a));

  return (
    <Link
      href={href}
      className={`group flex flex-col gap-3 text-text ${place.status === "full" ? "opacity-60" : ""}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-surface-muted">
        <CardPhotos
          paths={visiblePhotos(place, CARD_PHOTOS)}
          alt={name}
          priority={priority}
        />
        <span className="absolute top-2.5 left-2.5 flex gap-1.5">
          {place.status && <StatusBadge status={place.status} />}
          {place.verified && <VerifiedBadge />}
        </span>
        <span className="absolute top-2 right-2">
          <FavoriteButton placeId={place.id} />
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-base leading-snug font-medium group-hover:underline group-hover:underline-offset-4">
            {name}
          </h3>
          {place.stayPrice ? (
            <span className="tabular flex-none text-[15px] whitespace-nowrap">
              {f.t.rich(
                place.stayPrice.nights === 1
                  ? "nightPriceRich"
                  : "stayPriceRich",
                {
                  date: f.dayMonth(place.stayPrice.firstNight),
                  n: place.stayPrice.nights,
                  price: f.tenge(place.stayPrice.total),
                  muted: (chunks) => (
                    <span className="text-[13px] text-text-muted">
                      {chunks}
                    </span>
                  ),
                  b: (chunks) => <span className="font-medium">{chunks}</span>,
                },
              )}
              {place.stayPrice.perPersonUnknownGuests && (
                <span className="text-[13px] text-text-muted">
                  {" "}
                  {f.t("perPerson")}
                </span>
              )}
            </span>
          ) : (
            place.price_from != null && (
              <span className="tabular flex-none text-[15px] whitespace-nowrap">
                {f.t.rich("priceFromRich", {
                  price: f.tenge(place.price_from),
                  muted: (chunks) => (
                    <span className="text-[13px] text-text-muted">
                      {chunks}
                    </span>
                  ),
                  b: (chunks) => <span className="font-medium">{chunks}</span>,
                })}
              </span>
            )
          )}
        </div>
        <p className="text-sm text-text-muted">
          {details.join(" · ")}
          {amenities.length > 0 && (
            <span className="text-text-secondary">
              {" · "}
              {amenities.join(", ")}
            </span>
          )}
        </p>
        {place.promoted && (
          <span className="text-xs text-text-faint">{tPlans("ad")}</span>
        )}
      </div>
    </Link>
  );
}
