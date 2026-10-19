"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Landscape } from "@/components/site/Landscape";
import type { Video } from "@/lib/video";

const PROVIDER_NAMES = {
  youtube: "YouTube",
  instagram: "Instagram",
  tiktok: "TikTok",
} as const;

/**
 * Видео объекта. До нажатия — обложка с кнопкой ▶: плеер площадки
 * (и его cookie) грузится только когда гость сам захотел смотреть.
 */
export function VideoEmbed({
  video,
  fallbackPoster,
  title,
}: {
  video: Video;
  /** Главное фото объекта — для Reels и TikTok, у которых нет обложки без запроса. */
  fallbackPoster: string | undefined;
  title: string;
}) {
  const t = useTranslations("Place");
  const [playing, setPlaying] = useState(false);
  const poster = video.poster ?? fallbackPoster;
  const provider = PROVIDER_NAMES[video.provider];

  // Плеер Instagram — карточка: шапка с профилем, видео 4:5 и подвал.
  const card = playing && video.provider === "instagram";

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl ${
        card
          ? "max-w-[360px] border border-line bg-surface"
          : video.vertical
            ? "aspect-[9/16] max-w-[360px] bg-text"
            : "aspect-video bg-text"
      }`}
      style={
        card
          ? { height: "calc(min(100vw - 40px, 360px) * 1.25 + 190px)" }
          : undefined
      }
    >
      {playing ? (
        <iframe
          src={video.embedUrl}
          title={t("videoTitle", { name: title })}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          referrerPolicy="strict-origin-when-cross-origin"
          className="absolute inset-0 size-full border-0"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={t("videoPlay", { provider })}
          className="group absolute inset-0 flex size-full items-center justify-center"
        >
          {poster ? (
            <Image
              src={poster}
              alt=""
              fill
              unoptimized={video.poster !== null}
              sizes={
                video.vertical ? "360px" : "(min-width: 1024px) 720px, 100vw"
              }
              className="object-cover opacity-90 transition-opacity group-hover:opacity-100"
            />
          ) : (
            <Landscape />
          )}
          <span className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
          <span className="relative flex size-16 items-center justify-center rounded-full bg-white/95 text-text shadow-lg transition-transform group-hover:scale-105">
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
              className="ml-1"
            >
              <path d="M7 4.5v15l12.5-7.5z" />
            </svg>
          </span>
          <span className="absolute inset-x-4 bottom-4 text-left text-[13px] text-white/90">
            {t("videoFrom", { provider })}
          </span>
        </button>
      )}
    </div>
  );
}
