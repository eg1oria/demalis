"use client";

import { useSyncExternalStore } from "react";
import {
  type Consent,
  CONSENT_CHANGE_EVENT,
  consentCookie,
  gtagConsent,
  parseConsent,
  trackingCookieNames,
} from "@/lib/consent";

function subscribe(onChange: () => void) {
  window.addEventListener(CONSENT_CHANGE_EVENT, onChange);
  return () => window.removeEventListener(CONSENT_CHANGE_EVENT, onChange);
}

/**
 * Выбор посетителя из cookie `consent`: null — ещё не выбрал.
 * На сервере — «не выбрал», баннер и счётчики появляются только в браузере.
 */
export function useConsent(): Consent | null | undefined {
  return useSyncExternalStore(
    subscribe,
    () => parseConsent(document.cookie),
    () => undefined,
  );
}

/** Удалить cookie на текущем домене и на родительских (_ga ставится на .domain). */
function deleteCookie(name: string) {
  const parts = window.location.hostname.split(".");
  const domains = [""];
  for (let i = 0; i < parts.length - 1; i++)
    domains.push(`; Domain=.${parts.slice(i).join(".")}`);
  for (const domain of domains)
    document.cookie = `${name}=; Max-Age=0; Path=/${domain}`;
}

/** Сохранить выбор, сообщить Google (Consent Mode) и остальному сайту. */
export function saveConsent(value: Consent) {
  document.cookie = consentCookie(value, window.location.protocol === "https:");
  window.gtag?.("consent", "update", gtagConsent(value));
  if (value === "denied")
    for (const name of trackingCookieNames(document.cookie)) deleteCookie(name);
  window.dispatchEvent(
    new CustomEvent(CONSENT_CHANGE_EVENT, { detail: value }),
  );
}
