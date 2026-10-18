"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

/** Длиннее этого — сворачиваем до шести строк с кнопкой «Читать полностью». */
const LONG = 420;

export function Description({ text }: { text: string }) {
  const t = useTranslations("Place");
  const [open, setOpen] = useState(false);
  const long = text.length > LONG || text.split("\n").length > 6;

  return (
    <div className="flex flex-col items-start gap-2">
      <p
        className={`text-[15px] leading-relaxed whitespace-pre-line text-text-secondary ${
          long && !open ? "line-clamp-6" : ""
        }`}
      >
        {text}
      </p>
      {long && (
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex h-9 items-center text-sm font-medium underline underline-offset-4"
        >
          {open ? t("readLess") : t("readMore")}
        </button>
      )}
    </div>
  );
}
