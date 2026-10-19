"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import type { IsoDate } from "@/lib/dates";
import { GROUP_OCCASIONS, type GroupOccasion } from "@/lib/groups/validate";
import { GroupRequestForm } from "./GroupRequestForm";
import { ArrowRightIcon, UsersIcon } from "./Icons";

/**
 * Блок «Подберём за вас» на главной. Форма раскрывается по кнопке
 * или по поводу — так главная не растягивается длинной анкетой.
 */
export function GroupBlock({ today }: { today: IsoDate }) {
  const t = useTranslations("GroupForm");
  const [open, setOpen] = useState(false);
  const [occasion, setOccasion] = useState<GroupOccasion>();

  const start = (value?: GroupOccasion) => {
    setOccasion(value);
    setOpen(true);
  };

  return (
    <div className="flex flex-col gap-8 rounded-2xl border border-line bg-surface px-6 py-8 md:grid md:grid-cols-[1fr_1.15fr] md:gap-16 md:p-14">
      <div className="flex flex-col gap-4">
        <p className="flex items-center gap-2 text-[11px] font-medium tracking-[0.14em] text-text-muted uppercase">
          <UsersIcon size={16} />
          {t("eyebrow")}
        </p>
        <h2 className="font-display text-[26px] leading-[1.1] font-medium tracking-[-0.035em] md:text-[40px]">
          {t("title")}
        </h2>
        <p className="max-w-md text-[15px] leading-relaxed text-text-secondary md:text-base">
          {t("text")}
        </p>
        <ul className="mt-2 flex flex-col gap-2.5 text-[15px]">
          {(["point1", "point2", "point3"] as const).map((key) => (
            <li key={key} className="flex items-start gap-2.5">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="mt-0.5 flex-none"
              >
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
              {t(key)}
            </li>
          ))}
        </ul>
      </div>

      <div id="group" className="scroll-mt-4 md:self-center">
        {open ? (
          <GroupRequestForm today={today} occasion={occasion} />
        ) : (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-2.5">
              {(Object.keys(GROUP_OCCASIONS) as GroupOccasion[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => start(key)}
                  className="flex h-16 items-center justify-center rounded-[12px] border border-line px-3 text-center text-[15px] transition-colors hover:border-text"
                >
                  {t(`occasion_${key}`)}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => start()}
              className="flex h-13 items-center justify-center gap-2 rounded-[10px] bg-text text-[15px] font-medium text-white transition-opacity hover:opacity-90"
            >
              {t("open")}
              <ArrowRightIcon size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
