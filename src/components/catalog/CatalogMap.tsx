"use client";

import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { ChevronRightIcon } from "@/components/site/Icons";
import { PlacePhoto } from "@/components/site/PlacePhoto";
import { StatusDot } from "@/components/site/StatusBadge";
import { useFormat } from "@/components/site/useFormat";
import { Link } from "@/i18n/navigation";
import type { CatalogFilters } from "@/lib/catalog/filters";
import type { PlaceCardData } from "@/lib/catalog/query";
import { formatTenge } from "@/lib/format";
import { placeName, visiblePhotos } from "@/lib/places/present";
import { ViewToggle } from "./CatalogControls";
import type { MapPlace } from "./LeafletMap";

const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => <div className="size-full bg-map-bg" />,
});

export function CatalogMap({
  places,
  filters,
  nightLabel,
  placeQuery,
}: {
  places: PlaceCardData[];
  filters: CatalogFilters;
  nightLabel: string | null;
  placeQuery: Record<string, string>;
}) {
  const t = useTranslations("Catalog");
  const tStatus = useTranslations("Status");
  const tTypes = useTranslations("Types");
  const locale = useLocale();
  const f = useFormat();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const pins = useMemo<MapPlace[]>(
    () =>
      places
        .filter((p) => p.lat != null && p.lng != null)
        .map((p) => ({
          id: p.id,
          lat: p.lat!,
          lng: p.lng!,
          label: p.price_from != null ? formatTenge(p.price_from, locale) : "•",
          title: placeName(p, locale),
          status: p.status,
        })),
    [places, locale],
  );
  const missing = places.length - pins.length;
  const freeCount = places.filter(
    (p) => p.status === "free" || p.status === "limited",
  ).length;
  const selected = places.find((p) => p.id === selectedId);

  return (
    <div className="relative h-[calc(100dvh-8.5rem)] min-h-[480px] overflow-hidden md:mx-20 md:mb-6 md:h-[calc(100dvh-14rem)] md:rounded-3xl">
      <LeafletMap
        places={pins}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />

      <div className="pointer-events-none absolute inset-x-0 top-3 z-[1000] flex flex-col items-center gap-2 px-3">
        {nightLabel && (
          <span className="flex h-8 items-center gap-1.5 rounded-full bg-white/95 px-3 text-[13px] font-semibold shadow-float">
            <StatusDot status="free" size={7} />
            {t("mapFree", { count: freeCount, date: nightLabel })}
          </span>
        )}
        {missing > 0 && (
          <span className="rounded-full bg-white/95 px-3 py-1 text-xs text-text-muted shadow-float">
            {t("mapMissing", { count: missing })}
          </span>
        )}
      </div>

      <div className="absolute inset-x-0 bottom-4 z-[1000] flex flex-col items-center gap-3 px-4">
        <div className="shadow-float">
          <ViewToggle filters={filters} />
        </div>

        {selected && (
          <Link
            href={{ pathname: `/place/${selected.slug}`, query: placeQuery }}
            className="flex w-full max-w-md items-center gap-3.5 rounded-3xl bg-surface p-3 shadow-float"
          >
            <div className="relative size-28 flex-none overflow-hidden rounded-2xl bg-surface-muted">
              <PlacePhoto
                path={visiblePhotos(selected)[0]}
                seed={selected.id}
                alt={placeName(selected, locale)}
                sizes="112px"
              />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              {selected.status && nightLabel && (
                <span
                  className={`flex items-center gap-1.5 text-[13px] font-semibold ${
                    {
                      free: "text-status-free-text",
                      limited: "text-status-limited-text",
                    }[selected.status as "free"] ?? "text-text-muted"
                  }`}
                >
                  <StatusDot status={selected.status} size={7} />
                  {tStatus(selected.status)}
                </span>
              )}
              <span className="line-clamp-2 text-lg leading-snug font-semibold">
                {placeName(selected, locale)}
              </span>
              <span className="text-sm text-text-secondary">
                {[
                  tTypes(selected.type),
                  selected.drive_minutes != null &&
                    f.drive(selected.drive_minutes),
                  selected.capacity_max != null &&
                    f.t("upToGuests", { n: selected.capacity_max }),
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
              {selected.price_from != null && (
                <span className="text-base font-semibold">
                  {f.priceFrom(selected.price_from)}
                </span>
              )}
            </div>
            <ChevronRightIcon className="flex-none text-text-muted" />
          </Link>
        )}
      </div>
    </div>
  );
}
