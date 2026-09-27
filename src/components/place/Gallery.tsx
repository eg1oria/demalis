"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/site/Icons";
import { Landscape } from "@/components/site/Landscape";
import { BackButton } from "./BackButton";

/** Галерея: на телефоне листается свайпом (scroll-snap), на десктопе — ещё и стрелками. */
export function Gallery({
  urls,
  alt,
  seed,
}: {
  urls: string[];
  alt: string;
  seed: string;
}) {
  const t = useTranslations("Place");
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const go = (next: number) => {
    const el = track.current;
    if (!el) return;
    el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
  };

  return (
    <div className="relative h-82.5 overflow-hidden bg-surface-muted md:h-[480px] md:rounded-3xl">
      {urls.length === 0 ? (
        <>
          <Landscape seed={seed} />
          <span className="absolute bottom-10 left-1/2 -translate-x-1/2 rounded-full bg-text/60 px-3 py-1 text-xs font-semibold text-white md:bottom-4">
            {t("noPhoto")}
          </span>
        </>
      ) : (
        <div
          ref={track}
          onScroll={(e) => {
            const el = e.currentTarget;
            setIndex(Math.round(el.scrollLeft / el.clientWidth));
          }}
          className="no-scrollbar flex size-full snap-x snap-mandatory overflow-x-auto"
        >
          {urls.map((url, i) => (
            <div key={url} className="relative size-full flex-none snap-center">
              <Image
                src={url}
                alt={`${alt} — ${t("photo", { current: i + 1, total: urls.length })}`}
                fill
                priority={i === 0}
                sizes="(min-width: 768px) 768px, 100vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      )}

      <div className="absolute top-3.5 left-3.5 md:hidden">
        <BackButton />
      </div>

      {urls.length > 1 && (
        <>
          <span className="absolute right-3.5 bottom-9.5 flex h-7 items-center rounded-full bg-text/60 px-2.5 text-xs font-semibold text-white md:bottom-4">
            {index + 1} / {urls.length}
          </span>
          <button
            type="button"
            aria-label={t("prevPhoto")}
            disabled={index === 0}
            onClick={() => go(index - 1)}
            className="absolute top-1/2 left-4 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 disabled:opacity-0 md:flex"
          >
            <ChevronLeftIcon />
          </button>
          <button
            type="button"
            aria-label={t("nextPhoto")}
            disabled={index === urls.length - 1}
            onClick={() => go(index + 1)}
            className="absolute top-1/2 right-4 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 disabled:opacity-0 md:flex"
          >
            <ChevronRightIcon />
          </button>
        </>
      )}
    </div>
  );
}
