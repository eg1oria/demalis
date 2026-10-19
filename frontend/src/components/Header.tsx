import { useTranslations } from "next-intl";
import { Suspense } from "react";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { FavoritesLink } from "./site/FavoritesLink";
import { Logo } from "./site/Logo";
import { MobileMenu } from "./site/MobileMenu";

/** Шапка сайта. На каталоге и объекте на телефоне её заменяет своя верхняя панель. */
export function Header({ hideOnMobile = false }: { hideOnMobile?: boolean }) {
  const t = useTranslations("Header");
  const link =
    "flex h-11 items-center px-3 text-text-secondary transition-colors hover:text-text";

  return (
    <header
      className={`relative border-b border-line ${hideOnMobile ? "hidden md:block" : ""}`}
    >
      <div className="mx-auto flex h-15 w-full max-w-[1440px] items-center justify-between pr-3 pl-5 md:h-18 md:px-10 lg:px-20">
        <Logo />
        <nav className="hidden items-center text-sm md:flex">
          <Link href="/catalog" className={link}>
            {t("catalog")}
          </Link>
          <Link href="/collections" className={link}>
            {t("collections")}
          </Link>
          <Link href="/owners" className={link}>
            {t("owners")}
          </Link>
        </nav>
        <div className="flex items-center gap-0.5 md:gap-2">
          <Suspense>
            <LanguageSwitcher />
          </Suspense>
          <FavoritesLink />
          <Link
            href="/owners#add"
            className="ml-2 hidden h-10 items-center rounded-full border border-text px-4.5 text-sm transition-colors hover:bg-text hover:text-white md:flex"
          >
            {t("addPlace")}
          </Link>
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
