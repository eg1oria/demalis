/** Адрес сайта (фронтенда) без «/» в конце — для ссылок в письмах и Telegram. */
export function siteUrl(): string | null {
  return process.env.SITE_URL?.replace(/\/$/, '') || null;
}
