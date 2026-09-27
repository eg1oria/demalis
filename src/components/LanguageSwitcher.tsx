"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const LABELS = { ru: "Рус", kk: "Қаз" } as const;

export function LanguageSwitcher() {
  const t = useTranslations("Header");
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <nav aria-label={t("languageSwitcher")} className="flex gap-1">
      {routing.locales.map((l) => (
        <Link
          key={l}
          href={pathname}
          locale={l}
          aria-current={l === locale ? "true" : undefined}
          className={`flex h-11 min-w-11 items-center justify-center rounded-full px-3 text-sm font-medium ${
            l === locale ? "bg-text text-surface" : "text-text-secondary"
          }`}
        >
          {LABELS[l]}
        </Link>
      ))}
    </nav>
  );
}
