import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/**
 * Плашка «Проверено» (тариф Pro, только после проверки места): белая «таблетка»,
 * как у статуса занятости. На странице объекта — ссылка на /verified, что
 * именно проверяем; в карточке каталога (она сама ссылка) — подсказка.
 */
export function VerifiedBadge({
  onPhoto = true,
  link = false,
}: {
  onPhoto?: boolean;
  link?: boolean;
}) {
  const t = useTranslations("Plans");
  const className = `flex h-6.5 items-center gap-1 rounded-full px-2.5 text-xs font-medium whitespace-nowrap text-text ${
    onPhoto ? "bg-white/95" : "border border-line"
  }`;
  const content = (
    <>
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
    </>
  );
  return link ? (
    <Link
      href="/verified"
      title={t("verifiedHint")}
      className={`${className} transition-colors hover:border-text`}
    >
      {content}
    </Link>
  ) : (
    <span title={t("verifiedHint")} className={className}>
      {content}
    </span>
  );
}
