"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { HeartIcon } from "./Icons";
import { useFavorites } from "./useFavorites";

/** Иконка избранного в шапке: число сохранённых объектов. */
export function FavoritesLink() {
  const t = useTranslations("Favorites");
  const { ids } = useFavorites();

  return (
    <Link
      href="/favorites"
      aria-label={t("title")}
      className="relative flex size-11 items-center justify-center"
    >
      <HeartIcon size={20} />
      {ids.length > 0 && (
        <span className="tabular absolute top-1.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-text px-1 text-[10px] leading-none font-medium text-white">
          {ids.length}
        </span>
      )}
    </Link>
  );
}
