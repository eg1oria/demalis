"use client";

import { useTranslations } from "next-intl";
import { HeartIcon } from "./Icons";
import { useFavorites } from "./useFavorites";

/** Сердечко «В избранное». На фото — белый кружок, в тексте — контурная кнопка. */
export function FavoriteButton({
  placeId,
  variant = "card",
}: {
  placeId: string;
  /** card — маленький кружок на карточке, photo — на галерее, plain — кнопка с текстом. */
  variant?: "card" | "photo" | "plain";
}) {
  const t = useTranslations("Favorites");
  const { ids, toggle } = useFavorites();
  const active = ids.includes(placeId);

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={
        variant === "plain" ? undefined : active ? t("remove") : t("add")
      }
      onClick={(e) => {
        // Кнопка лежит внутри ссылки карточки — не переходим на объект.
        e.preventDefault();
        e.stopPropagation();
        toggle(placeId);
      }}
      className={
        variant === "plain"
          ? "flex h-11 flex-1 items-center justify-center gap-2 rounded-[10px] border border-line text-sm transition-colors hover:border-text"
          : `flex items-center justify-center rounded-full bg-white/95 text-text ${variant === "photo" ? "size-11" : "size-9"}`
      }
    >
      <HeartIcon size={18} filled={active} />
      {variant === "plain" && (active ? t("saved") : t("save"))}
    </button>
  );
}
