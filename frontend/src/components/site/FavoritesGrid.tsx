"use client";

import { type ReactNode, useSyncExternalStore } from "react";
import { useFavorites } from "./useFavorites";

const noop = () => () => {};

/**
 * Сетка избранного: карточка исчезает сразу после снятия сердечка,
 * без перезагрузки. До гидрации показываем всё, что отрисовал сервер.
 */
export function FavoritesGrid({
  items,
  empty,
}: {
  items: { id: string; card: ReactNode }[];
  empty: ReactNode;
}) {
  const { ids } = useFavorites();
  const mounted = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
  const visible = mounted ? items.filter((i) => ids.includes(i.id)) : items;

  if (visible.length === 0) return empty;
  return (
    <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
      {visible.map((item) => (
        <li key={item.id}>{item.card}</li>
      ))}
    </ul>
  );
}
