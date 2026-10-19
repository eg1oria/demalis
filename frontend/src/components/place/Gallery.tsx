"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { type ReactNode, useEffect, useRef, useState } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
} from "@/components/site/Icons";
import { Landscape } from "@/components/site/Landscape";
import { BackButton } from "./BackButton";

/** Сколько фото в сетке на десктопе: одно большое и четыре маленьких. */
const GRID = 5;

/** Лента фото со свайпом (scroll-snap) и стрелками на десктопе. */
function Carousel({
  urls,
  alt,
  start = 0,
  fit = "cover",
  sizes,
  onIndex,
}: {
  urls: string[];
  alt: string;
  start?: number;
  fit?: "cover" | "contain";
  sizes: string;
  onIndex?: (index: number) => void;
}) {
  const t = useTranslations("Place");
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(start);

  useEffect(() => {
    const el = track.current;
    if (el && start > 0) el.scrollTo({ left: start * el.clientWidth });
  }, [start]);

  const go = (next: number) => {
    const el = track.current;
    if (el) el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
  };

  const arrow =
    "absolute top-1/2 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-text disabled:opacity-0 md:flex";

  return (
    <>
      <div
        ref={track}
        onScroll={(e) => {
          const el = e.currentTarget;
          const next = Math.round(el.scrollLeft / el.clientWidth);
          setIndex(next);
          onIndex?.(next);
        }}
        className="no-scrollbar flex size-full snap-x snap-mandatory overflow-x-auto"
      >
        {urls.map((url, i) => (
          <div key={url} className="relative size-full flex-none snap-center">
            <Image
              src={url}
              alt={`${alt} — ${t("photo", { current: i + 1, total: urls.length })}`}
              fill
              priority={i === start}
              sizes={sizes}
              className={fit === "cover" ? "object-cover" : "object-contain"}
            />
          </div>
        ))}
      </div>
      {urls.length > 1 && (
        <>
          <span className="tabular absolute right-3.5 bottom-9.5 flex h-7 items-center rounded-full bg-black/55 px-2.5 text-xs text-white md:bottom-4">
            {index + 1} / {urls.length}
          </span>
          <button
            type="button"
            aria-label={t("prevPhoto")}
            disabled={index === 0}
            onClick={() => go(index - 1)}
            className={`${arrow} left-4`}
          >
            <ChevronLeftIcon />
          </button>
          <button
            type="button"
            aria-label={t("nextPhoto")}
            disabled={index === urls.length - 1}
            onClick={() => go(index + 1)}
            className={`${arrow} right-4`}
          >
            <ChevronRightIcon />
          </button>
        </>
      )}
    </>
  );
}

/** Полноэкранный просмотр: Esc или крестик закрывают, фон не прокручивается. */
function Lightbox({
  urls,
  alt,
  start,
  onClose,
}: {
  urls: string[];
  alt: string;
  start: number;
  onClose: () => void;
}) {
  const t = useTranslations("Place");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      className="fixed inset-0 z-50 bg-black"
    >
      <Carousel
        urls={urls}
        alt={alt}
        start={start}
        fit="contain"
        sizes="100vw"
      />
      <button
        type="button"
        aria-label={t("closePhotos")}
        onClick={onClose}
        className="absolute top-4 right-4 flex size-11 items-center justify-center rounded-full bg-white/95 text-text"
      >
        <CloseIcon />
      </button>
    </div>
  );
}

/**
 * Галерея объекта. Телефон и планшет — лента со свайпом. Десктоп при трёх
 * и больше фото — сетка «одно большое + четыре», клик открывает просмотр.
 */
export function Gallery({
  urls,
  alt,
  actions,
}: {
  urls: string[];
  alt: string;
  /** Кнопки поверх фото на телефоне: избранное, «Поделиться». */
  actions?: ReactNode;
}) {
  const t = useTranslations("Place");
  const [open, setOpen] = useState<number | null>(null);
  const grid = urls.length >= 3;

  return (
    <>
      <div
        className={`relative h-82.5 overflow-hidden bg-surface-muted md:h-[460px] md:rounded-2xl ${grid ? "lg:hidden" : ""}`}
      >
        {urls.length === 0 ? (
          <>
            <Landscape />
            <span className="absolute bottom-10 left-1/2 -translate-x-1/2 text-xs text-text-muted md:bottom-6">
              {t("noPhoto")}
            </span>
          </>
        ) : (
          <Carousel
            urls={urls}
            alt={alt}
            sizes="(min-width: 768px) 90vw, 100vw"
          />
        )}
        <div className="absolute top-3.5 left-3.5 md:hidden">
          <BackButton />
        </div>
        {actions && (
          <div className="absolute top-3.5 right-3.5 flex gap-2 md:hidden">
            {actions}
          </div>
        )}
      </div>

      {grid && (
        <div className="relative hidden h-[460px] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-2xl lg:grid">
          {urls.slice(0, GRID).map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => setOpen(i)}
              className={`relative overflow-hidden bg-surface-muted ${
                i === 0
                  ? "col-span-2 row-span-2"
                  : urls.length === 3
                    ? "col-span-2"
                    : urls.length === 4 && i === 3
                      ? "col-span-2"
                      : ""
              }`}
            >
              <Image
                src={url}
                alt={`${alt} — ${t("photo", { current: i + 1, total: urls.length })}`}
                fill
                priority={i === 0}
                sizes={i === 0 ? "50vw" : "25vw"}
                className="object-cover transition-opacity hover:opacity-90"
              />
            </button>
          ))}
          <button
            type="button"
            onClick={() => setOpen(0)}
            className="tabular absolute right-4 bottom-4 flex h-9 items-center rounded-full bg-white/95 px-4 text-sm text-text"
          >
            {t("allPhotos")} · {urls.length}
          </button>
        </div>
      )}

      {open !== null && (
        <Lightbox
          urls={urls}
          alt={alt}
          start={open}
          onClose={() => setOpen(null)}
        />
      )}
    </>
  );
}
