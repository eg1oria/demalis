import { useTranslations } from "next-intl";
import { SITE_NAME } from "@/config/site";
import { Link } from "@/i18n/navigation";
import { Logo } from "./Logo";

export function Footer() {
  const t = useTranslations("Footer");
  const h = useTranslations("Header");
  const link =
    "flex min-h-8 items-center text-text-secondary transition-colors hover:text-text";

  return (
    <footer className="mt-20 border-t border-line">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-5 pt-8 pb-10 md:flex-row md:items-start md:justify-between md:px-10 lg:px-20">
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
          <Link href="/privacy" className={link}>
            {t("privacy")}
          </Link>
        </nav>
        <p className="text-[13px] text-text-faint lowercase">
          © {new Date().getFullYear()} {SITE_NAME}
        </p>
      </div>
    </footer>
  );
}
