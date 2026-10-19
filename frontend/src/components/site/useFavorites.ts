"use client";

import { useSyncExternalStore } from "react";
import {
  FAVORITES_COOKIE,
  FAVORITES_MAX_AGE,
  parseFavorites,
  serializeFavorites,
  toggleFavorite,
} from "@/lib/favorites";

// Общее состояние избранного для всех сердечек и счётчика в шапке.
const EVENT = "favorites-change";
const EMPTY: string[] = [];

let cachedCookie: string | null = null;
let cachedIds: string[] = EMPTY;

function readCookie(): string {
  const prefix = `${FAVORITES_COOKIE}=`;
  return (
    document.cookie
      .split("; ")
      .find((c) => c.startsWith(prefix))
      ?.slice(prefix.length) ?? ""
  );
}

function getSnapshot(): string[] {
  const raw = readCookie();
  if (raw !== cachedCookie) {
    cachedCookie = raw;
    cachedIds = parseFavorites(raw);
  }
  return cachedIds;
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  // Другая вкладка тоже могла поменять cookie — сверяемся при возврате.
  window.addEventListener("focus", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("focus", onChange);
  };
}

export function useFavorites() {
  const ids = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);

  const toggle = (id: string) => {
    const next = toggleFavorite(getSnapshot(), id);
    document.cookie = `${FAVORITES_COOKIE}=${serializeFavorites(next)}; path=/; max-age=${FAVORITES_MAX_AGE}; samesite=lax`;
    window.dispatchEvent(new Event(EVENT));
  };

  return { ids, toggle };
}
