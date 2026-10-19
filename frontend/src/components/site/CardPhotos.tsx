"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { photoUrl } from "@/lib/supabase/env";
import { ChevronLeftIcon, ChevronRightIcon } from "./Icons";
import { Landscape } from "./Landscape";

const SIZES = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw";

/**
 * Фото в карточке каталога: листаются свайпом (scroll-snap), на десктопе —
 * стрелками при наведении. Первое фото грузится сразу, остальные лениво.
 */
export function CardPhotos({
  paths,
  alt,
  priority = false,
}: {
  paths: string[];
  alt: string;
  priority?: boolean;
}) {
  const t = useTranslations("Place");
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  if (paths.length === 0) return <Landscape />;

  const go = (e: React.MouseEvent, next: number) => {
    // Стрелки лежат внутри ссылки карточки — листаем, а не переходим.
    e.preventDefault();
    e.stopPropagation();
    const el = track.current;
    if (el) el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
  };

  const arrow =
    "absolute top-1/2 hidden size-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-text opacity-0 transition-opacity group-hover:opacity-100 disabled:invisible md:flex";

  return (
    <>
      <div
        ref={track}
        onScroll={(e) => {
          const el = e.currentTarget;
          setIndex(Math.round(el.scrollLeft / el.clientWidth));
        }}
        className="no-scrollbar absolute inset-0 flex snap-x snap-mandatory overflow-x-auto"
      >
        {paths.map((path, i) => (
          <div key={path} className="relative size-full flex-none snap-center">
            <Image
              src={photoUrl(path)}
              alt={i === 0 ? alt : `${alt} — ${i + 1}`}
              fill
              sizes={SIZES}
              priority={priority && i === 0}
              className="object-cover"
            />
          </div>
        ))}
      </div>
      {paths.length > 1 && (
        <>
          <button
            type="button"
            aria-label={t("prevPhoto")}
            disabled={index === 0}
            onClick={(e) => go(e, index - 1)}
            className={`${arrow} left-2.5`}
          >
            <ChevronLeftIcon size={16} />
          </button>
          <button
            type="button"
            aria-label={t("nextPhoto")}
            disabled={index === paths.length - 1}
            onClick={(e) => go(e, index + 1)}
            className={`${arrow} right-2.5`}
          >
            <ChevronRightIcon size={16} />
          </button>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-2.5 flex justify-center gap-1"
          >
            {paths.map((path, i) => (
              <span
                key={path}
                className={`size-1.5 rounded-full ${i === index ? "bg-white" : "bg-white/50"}`}
              />
            ))}
          </span>
        </>
      )}
    </>
  );
}
