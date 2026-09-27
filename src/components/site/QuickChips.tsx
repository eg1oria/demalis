import { useTranslations } from "next-intl";
import { catalogHref, type CatalogFilters } from "@/lib/catalog/filters";
import { ChipLink } from "./Chip";

const QUICK: [key: string, filters: Partial<CatalogFilters>][] = [
  ["chan", { amenities: ["chan"] }],
  ["banya", { amenities: ["banya"] }],
  ["drive60", { drive: 60 }],
  ["pets", { amenities: ["pets"] }],
  ["pool", { amenities: ["pool"] }],
  ["kapshagay", { dir: "kapshagay" }],
  ["winter", { amenities: ["winter"] }],
  ["big", { guests: 10 }],
];

/** Быстрые фильтры на главной — ссылки в каталог. */
export function QuickChips() {
  const t = useTranslations("Chips");
  const h = useTranslations("HomePage");

  return (
    <nav
      aria-label={h("quickFilters")}
      className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0"
    >
      {QUICK.map(([key, filters]) => (
        <ChipLink key={key} href={catalogHref(filters)}>
          {t(key as "chan")}
        </ChipLink>
      ))}
    </nav>
  );
}
