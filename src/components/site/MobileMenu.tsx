"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { CloseIcon, MenuIcon } from "./Icons";

export function MobileMenu() {
  const t = useTranslations("Header");
  const [open, setOpen] = useState(false);

  return (
    <div className="relative md:hidden">
      <button
        type="button"
        aria-label={t("menu")}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex size-11 items-center justify-center rounded-full"
      >
        {open ? <CloseIcon size={22} /> : <MenuIcon size={22} />}
      </button>
      {open && (
        <nav className="absolute right-0 top-12 z-20 flex w-56 flex-col rounded-[14px] border border-line-soft bg-surface p-2 shadow-[0_10px_30px_rgba(23,32,28,0.06)]">
          {(
            [
              ["/catalog", t("catalog")],
              ["/owners", t("owners")],
            ] as const
          ).map(([href, label]) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="flex min-h-11 items-center rounded-[10px] px-3 font-medium"
            >
              {label}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
