"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { useConsent } from "./useConsent";

type Ym = ((...args: unknown[]) => void) & { a?: unknown[]; l?: number };
declare global {
  interface Window {
    ym?: Ym;
  }
}

const TAG_URL = "https://mc.yandex.ru/metrika/tag.js";

/** Очередь вызовов, пока tag.js не загрузился (так делает и официальный код счётчика). */
function ym(...args: unknown[]) {
  if (!window.ym) {
    const stub: Ym = (...a) => (stub.a ??= []).push(a);
    stub.l = Date.now();
    window.ym = stub;
  }
  window.ym(...args);
}

/**
 * Яндекс Метрика — только после «Принять» в уведомлении о cookie.
 * Скрипт грузится, когда страница уже показана (не мешает скорости
 * загрузки). Переходы внутри сайта отправляются вручную (defer).
 * Вебвизор выключен: он записывает ввод в формы, а там телефоны гостей.
 * Пикселя для браузеров без JS нет: без JS согласие не дать.
 */
export function YandexMetrika({ id }: { id: string }) {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const previousUrl = useRef<string | null>(null);
  const granted = useConsent() === "granted";

  useEffect(() => {
    if (!granted) return;
    ym(Number(id), "init", {
      defer: true,
      clickmap: true,
      trackLinks: true,
      accurateTrackBounce: true,
      webvisor: false,
    });
    const load = () => {
      if (document.querySelector(`script[src="${TAG_URL}"]`)) return;
      const script = document.createElement("script");
      script.src = TAG_URL;
      script.async = true;
      document.head.appendChild(script);
    };
    const idle = window.requestIdleCallback ?? ((cb) => setTimeout(cb, 1500));
    if (document.readyState === "complete") idle(load);
    else window.addEventListener("load", () => idle(load), { once: true });
  }, [id, granted]);

  useEffect(() => {
    if (!granted) return;
    const url = window.location.href;
    ym(Number(id), "hit", url, {
      referer: previousUrl.current ?? document.referrer,
      title: document.title,
    });
    previousUrl.current = url;
  }, [id, granted, pathname, search]);

  return null;
}
