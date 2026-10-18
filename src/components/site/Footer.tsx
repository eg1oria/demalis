import { useTranslations } from "next-intl";
import { LEGAL } from "@/config/legal";
import { SITE_NAME } from "@/config/site";
import { Link } from "@/i18n/navigation";
import { CookieSettingsButton } from "./CookieSettingsButton";
import { Logo } from "./Logo";

/**
 * Подвал: навигация, юридические страницы и реквизиты владельца сайта
 * (src/config/legal.ts) — их же Google сверяет при модерации рекламы.
 */
export function Footer() {
  const t = useTranslations("Footer");
  const h = useTranslations("Header");
  const link =
    "flex min-h-8 items-center text-text-secondary transition-colors hover:text-text";
  const small =
    "flex min-h-8 items-center text-text-muted transition-colors hover:text-text";

  return (
    <footer className="mt-20 border-t border-line">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-5 pt-8 pb-10 md:px-10 lg:px-20">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-1.5">
            <Logo size="sm" />
            <p className="text-sm text-text-muted">{t("tagline")}</p>
          </div>
          <nav className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
            <Link href="/catalog" className={link}>
              {h("catalog")}
            </Link>
            <Link href="/collections" className={link}>
              {t("collections")}
            </Link>
            <Link href="/favorites" className={link}>
              {h("favorites")}
            </Link>
            <Link href="/owners" className={link}>
              {h("owners")}
            </Link>
            <Link href="/about" className={link}>
              {t("about")}
            </Link>
            <Link href="/contacts" className={link}>
              {t("contacts")}
            </Link>
          </nav>
        </div>

        <nav className="flex flex-wrap gap-x-5 gap-y-1 border-t border-line pt-5 text-[13px]">
          <Link href="/terms" className={small}>
            {t("terms")}
          </Link>
          <Link href="/offer" className={small}>
            {t("offer")}
          </Link>
          <Link href="/privacy" className={small}>
            {t("privacy")}
          </Link>
          <Link href="/verified" className={small}>
            {t("verified")}
          </Link>
          <CookieSettingsButton label={t("cookies")} className={small} />
        </nav>

        <div className="flex flex-col gap-1.5 text-[13px] leading-relaxed text-text-muted">
          <p>{t("disclaimer", { site: SITE_NAME })}</p>
          <p>
            {t("requisites", { operator: LEGAL.operator, bin: LEGAL.bin })}
            {" · "}
            {LEGAL.address}
          </p>
          <p>
            {LEGAL.phone} · {LEGAL.email}
          </p>
          <p className="text-text-faint lowercase">
            © {new Date().getFullYear()} {SITE_NAME}
          </p>
        </div>
      </div>
    </footer>
  );
}
