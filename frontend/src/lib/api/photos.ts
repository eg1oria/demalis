// Фото раздаёт бэкенд по /uploads/…; Next проксирует этот путь (next.config.ts),
// поэтому адрес — с того же домена, что и сайт.

/** Ссылка на фото объекта по пути из places.photos (places/<uuid>.<ext>). */
export function photoUrl(path: string): string {
  return `/uploads/${path}`;
}
