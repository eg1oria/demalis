import { useTranslations } from "next-intl";

/** Плашка «Проверено» (тариф Pro): белая «таблетка», как у статуса занятости. */
export function VerifiedBadge({ onPhoto = true }: { onPhoto?: boolean }) {
  const t = useTranslations("Plans");
  return (
    <span
      className={`flex h-7 items-center gap-1 rounded-full px-2.5 text-[13px] font-semibold whitespace-nowrap text-text ${
        onPhoto ? "bg-white/95" : "border border-line bg-surface"
      }`}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="text-accent"
      >
        <path d="M5 12.5l4.5 4.5L19 7.5" />
      </svg>
      {t("verified")}
    </span>
  );
}
