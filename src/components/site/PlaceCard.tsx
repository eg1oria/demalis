import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { PlaceCardData } from "@/lib/catalog/query";
import { placeAmenities, placeName, visiblePhotos } from "@/lib/places/present";
import { AmenityIcon, ClockIcon, UserIcon } from "./Icons";
import { PlacePhoto } from "./PlacePhoto";
import { StatusBadge } from "./StatusBadge";
import { VerifiedBadge } from "./VerifiedBadge";
import { useFormat } from "./useFormat";

/** Карточка объекта в каталоге. */
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

  return (
    <Link
      href={href}
      className={`group flex flex-col gap-3 text-text ${place.status === "full" ? "opacity-60" : ""}`}
    >
      <div className="relative aspect-[35/24] overflow-hidden rounded-[20px] bg-surface-muted">
        <PlacePhoto
          path={visiblePhotos(place)[0]}
          seed={place.id}
          alt={name}
          priority={priority}
          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
        />
        {place.status && (
          <span className="absolute top-3 left-3">
            <StatusBadge status={place.status} />
          </span>
        )}
        {place.verified && (
          <span className="absolute top-3 right-3">
            <VerifiedBadge />
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1.5 px-0.5">
        {place.promoted && (
          <span className="-mb-1 text-xs text-text-faint">{tPlans("ad")}</span>
        )}
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-lg font-semibold tracking-[-0.01em] group-hover:text-accent">
            {name}
          </h3>
          {place.price_from != null && (
            <span className="flex-none text-base whitespace-nowrap">
              {f.t.rich("priceFromRich", {
                price: f.tenge(place.price_from),
                muted: (chunks) => (
                  <span className="text-[13px] text-text-muted">{chunks}</span>
                ),
                b: (chunks) => <span className="font-semibold">{chunks}</span>,
              })}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-text-secondary">
          <span>{tTypes(place.type)}</span>
          {place.drive_minutes != null && (
            <span className="flex items-center gap-1.5">
              <ClockIcon size={15} />
              {f.drive(place.drive_minutes)}
            </span>
          )}
          {place.capacity_max != null && (
            <span className="flex items-center gap-1.5">
              <UserIcon size={15} />
              {f.t("upTo", { n: place.capacity_max })}
            </span>
          )}
        </div>
        <ul className="mt-0.5 flex flex-wrap gap-1.5">
          {placeAmenities(place, 3).map((amenity) => (
            <li
              key={amenity}
              className="flex h-7 items-center gap-1.5 rounded-lg bg-surface-muted px-2.5 text-xs font-medium text-text-secondary"
            >
              <AmenityIcon
                amenity={amenity}
                size={14}
                className="text-accent"
              />
              {tAmenities(amenity)}
            </li>
          ))}
        </ul>
      </div>
    </Link>
  );
}
