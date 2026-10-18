"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { CloseIcon, MenuIcon } from "./Icons";

export function MobileMenu() {
  const t = useTranslations("Header");
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={t("menu")}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex size-11 items-center justify-center"
      >
        {open ? <CloseIcon size={22} /> : <MenuIcon size={22} />}
      </button>
      {open && (
        <nav className="absolute inset-x-0 top-15 z-40 flex flex-col border-b border-line bg-bg px-5 pt-2 pb-6">
          {(
            [
              ["/catalog", t("catalog")],
              ["/collections", t("collections")],
              ["/favorites", t("favorites")],
              ["/owners", t("owners")],
              ["/about", t("about")],
              ["/contacts", t("contacts")],
            ] as const
          ).map(([href, label]) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="flex min-h-13 items-center border-b border-line-soft font-display text-lg"
            >
              {label}
            </Link>
          ))}
          <Link
            href="/owners#add"
            onClick={() => setOpen(false)}
            className="mt-5 flex h-12 items-center justify-center rounded-[10px] bg-text text-[15px] font-medium text-white"
          >
            {t("addPlace")}
          </Link>
        </nav>
      )}
    </div>
  );
}
