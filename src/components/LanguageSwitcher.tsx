"use client";

import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

const LABELS = { ru: "RU", kk: "ҚАЗ" } as const;

/** Пилюля «RU / ҚАЗ»: нажатие переключает на другой язык, фильтры в адресе сохраняются. */
export function LanguageSwitcher() {
  const t = useTranslations("Header");
  const locale = useLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const other = locale === "ru" ? "kk" : "ru";
  const query = Object.fromEntries(searchParams.entries());

  return (
    <Link
      href={{ pathname, query }}
      locale={other}
      aria-label={`${t("languageSwitcher")}: ${LABELS[other]}`}
      className="flex h-11 items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 text-[13px] font-semibold"
    >
      {(["ru", "kk"] as const).map((l, i) => (
        <span key={l} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-line-strong">/</span>}
          <span className={l === locale ? "text-text" : "text-text-muted"}>
            {LABELS[l]}
          </span>
        </span>
      ))}
    </Link>
  );
}
