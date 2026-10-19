// Копия: backend/src/shared/video.ts — менять вместе.

export type VideoProvider = "youtube" | "instagram" | "tiktok";

export type Video = {
  provider: VideoProvider;
  id: string;
  /** Адрес для iframe: видео запускается сразу, раз гость уже нажал ▶. */
  embedUrl: string;
  /** Вертикальное видео (Reels, TikTok, Shorts) — 9:16, иначе 16:9. */
  vertical: boolean;
  /** Обложка от площадки. Нет — берём главное фото объекта. */
  poster: string | null;
};

const YOUTUBE_ID = /^[\w-]{11}$/;
const INSTAGRAM_CODE = /^[\w-]{5,40}$/;
const KINDS = ["reel", "reels", "p", "tv"];
const TIKTOK_ID = /^\d{8,25}$/;

function youtube(id: string, vertical: boolean): Video | null {
  if (!YOUTUBE_ID.test(id)) return null;
  return {
    provider: "youtube",
    id,
    embedUrl: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1`,
    vertical,
    poster: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
  };
}

/**
 * Ссылка на Reels, TikTok или YouTube → данные для встроенного плеера.
 * Короткие ссылки TikTok (vm.tiktok.com) без запроса в сеть не разобрать — null.
 */
export function parseVideo(input: string | null | undefined): Video | null {
  let url: URL;
  try {
    url = new URL((input ?? "").trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const host = url.hostname.toLowerCase().replace(/^(www\.|m\.)/, "");
  const parts = url.pathname.split("/").filter(Boolean);

  if (host === "youtu.be") return youtube(parts[0] ?? "", false);
  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (parts[0] === "watch")
      return youtube(url.searchParams.get("v") ?? "", false);
    if (parts[0] === "shorts") return youtube(parts[1] ?? "", true);
    if (parts[0] === "embed" || parts[0] === "live")
      return youtube(parts[1] ?? "", false);
    return null;
  }

  if (host === "instagram.com") {
    // instagram.com/reel/… или instagram.com/<ник>/reel/… (ссылка из профиля)
    const at = parts.findIndex((p) => KINDS.includes(p));
    const kind = parts[at];
    const code = parts[at + 1] ?? "";
    if (at < 0 || !INSTAGRAM_CODE.test(code)) return null;
    return {
      provider: "instagram",
      id: code,
      embedUrl: `https://www.instagram.com/${kind === "p" ? "p" : "reel"}/${code}/embed/`,
      vertical: true,
      poster: null,
    };
  }

  if (host === "tiktok.com") {
    // tiktok.com/@user/video/123… или tiktok.com/embed/v2/123…
    const at = parts.indexOf("video");
    const id =
      at >= 0 ? parts[at + 1] : parts[0] === "embed" ? parts.at(-1) : undefined;
    if (!id || !TIKTOK_ID.test(id)) return null;
    return {
      provider: "tiktok",
      id,
      embedUrl: `https://www.tiktok.com/player/v1/${id}?autoplay=1&rel=0`,
      vertical: true,
      poster: null,
    };
  }

  return null;
}
