// Избранное хранится в cookie браузера: без входа на сайт и так, чтобы
// страницу /favorites мог отрисовать сервер. В cookie — только id объектов.

export const FAVORITES_COOKIE = "fav";
/** Больше не храним: cookie ограничена ~4 КБ, 50 uuid ≈ 1,9 КБ. */
export const FAVORITES_MAX = 50;
/** Год в секундах. */
export const FAVORITES_MAX_AGE = 60 * 60 * 24 * 365;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Значение cookie → список id: только uuid, без повторов, не больше лимита. */
export function parseFavorites(value: string | undefined | null): string[] {
  if (!value) return [];
  let decoded: string;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return [];
  }
  const ids = decoded
    .split(".")
    .map((id) => id.trim().toLowerCase())
    .filter((id) => UUID.test(id));
  return [...new Set(ids)].slice(0, FAVORITES_MAX);
}

export function serializeFavorites(ids: string[]): string {
  return ids.slice(0, FAVORITES_MAX).join(".");
}

/** Добавить или убрать объект. Новые — в начало: последние добавленные сверху. */
export function toggleFavorite(ids: string[], id: string): string[] {
  return ids.includes(id)
    ? ids.filter((x) => x !== id)
    : [id, ...ids].slice(0, FAVORITES_MAX);
}
