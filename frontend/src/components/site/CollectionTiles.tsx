import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { type Collection, collectionTitle } from "@/lib/collections";
import { PlacePhoto } from "./PlacePhoto";

/** Плитки подборок: обложка — фото объекта из подборки, ниже название и «24 места». */
export function CollectionTiles({
  collections,
}: {
  collections: (Collection & { count: number; cover?: string })[];
}) {
  const locale = useLocale();
  const t = useTranslations("Collections");

  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-4 md:gap-x-6">
      {collections.map((c) => {
        const title = collectionTitle(c, locale);
        return (
          <li key={c.id}>
            <Link
              href={`/collections/${c.slug}`}
              className="group flex flex-col gap-3 text-text"
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-surface-muted">
                <PlacePhoto
                  path={c.cover}
                  alt={title}
                  sizes="(min-width: 768px) 25vw, 50vw"
                />
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[15px] leading-snug font-medium group-hover:underline group-hover:underline-offset-4">
                  {title}
                </span>
                <span className="tabular flex-none text-[13px] text-text-muted">
                  {t("places", { n: c.count })}
                </span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
