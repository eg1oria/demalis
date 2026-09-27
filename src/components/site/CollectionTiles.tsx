import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { type Collection, collectionTitle } from "@/lib/collections";
import { Landscape } from "./Landscape";

/** Плитки подборок: пейзаж, название, «24 места». */
export function CollectionTiles({
  collections,
}: {
  collections: (Collection & { count: number })[];
}) {
  const locale = useLocale();
  const t = useTranslations("Collections");

  return (
    <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-6">
      {collections.map((c, i) => (
        <li key={c.id}>
          <Link
            href={`/collections/${c.slug}`}
            className="flex h-full flex-col overflow-hidden rounded-[18px] border border-line-soft bg-surface text-text md:rounded-[20px]"
          >
            <div className="relative h-24 md:h-35">
              <Landscape seed={c.slug} hut={false} variant={i} />
            </div>
            <div className="flex flex-col gap-0.5 px-3.5 pt-3 pb-3.5 md:px-4.5 md:pt-4 md:pb-4.5">
              <span className="text-[15px] font-semibold">
                {collectionTitle(c, locale)}
              </span>
              <span className="text-[13px] text-text-muted">
                {t("places", { n: c.count })}
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
