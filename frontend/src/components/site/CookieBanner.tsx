"use client";

import { useTranslations } from "next-intl";
import { useSyncExternalStore } from "react";
import { Link } from "@/i18n/navigation";
import { CONSENT_OPEN_EVENT } from "@/lib/consent";
import { saveConsent, useConsent } from "./useConsent";

/** Открыт ли баннер кнопкой «Настройки cookie» (после того как выбор уже сделан). */
let reopened = false;
const listeners = new Set<() => void>();
function setReopened(value: boolean) {
  reopened = value;
  for (const listener of listeners) listener();
}
function subscribeReopen(onChange: () => void) {
  const onOpen = () => setReopened(true);
  listeners.add(onChange);
  window.addEventListener(CONSENT_OPEN_EVENT, onOpen);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener(CONSENT_OPEN_EVENT, onOpen);
  };
}

/**
 * Уведомление о cookie: узкая полоса внизу, не закрывает страницу и не мешает
 * ею пользоваться. «Принять» и «Отказаться» одинаково заметны. Показывается,
 * пока нет выбора, и снова — по «Настройки cookie» в подвале.
 */
export function CookieBanner() {
  const t = useTranslations("Consent");
  const consent = useConsent();
  const open = useSyncExternalStore(
    subscribeReopen,
    () => reopened,
    () => false,
  );
  if (consent !== null && !open) return null;

  const choose = (value: "granted" | "denied") => {
    saveConsent(value);
    setReopened(false);
  };
  const button =
    "h-10 flex-1 rounded-[10px] border border-text px-4 text-sm font-medium transition-colors hover:bg-text hover:text-white sm:flex-none";

  return (
    <div
      data-cookie-banner
      role="region"
      aria-label={t("label")}
      className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(12px,env(safe-area-inset-bottom))]"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-3 rounded-2xl border border-line bg-surface p-4 shadow-[0_8px_30px_rgba(0,0,0,0.08)] sm:flex-row sm:items-center sm:gap-5">
        <p className="text-[13px] leading-relaxed text-text-secondary sm:flex-1">
          {t.rich("text", {
            link: (chunks) => (
              <Link href="/privacy" className="underline underline-offset-2">
                {chunks}
              </Link>
            ),
          })}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            className={button}
            onClick={() => choose("denied")}
          >
            {t("decline")}
          </button>
          <button
            type="button"
            className={button}
            onClick={() => choose("granted")}
          >
            {t("accept")}
          </button>
        </div>
      </div>
    </div>
  );
}
