import { useTranslations } from "next-intl";
import { Suspense } from "react";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Logo } from "./site/Logo";
import { MobileMenu } from "./site/MobileMenu";

/** Шапка сайта. На каталоге и объекте на телефоне её заменяет своя верхняя панель. */
export function Header({ hideOnMobile = false }: { hideOnMobile?: boolean }) {
  const t = useTranslations("Header");

  return (
    <header className={hideOnMobile ? "hidden md:block" : undefined}>
      <div className="mx-auto flex h-15 w-full max-w-[1440px] items-center justify-between pl-5 pr-4 md:h-22 md:px-20">
        <Logo />
        <nav className="hidden items-center gap-2 text-[15px] font-medium md:flex">
          <Link href="/catalog" className="flex h-11 items-center px-4">
            {t("catalog")}
          </Link>
          <Link href="/owners" className="flex h-11 items-center px-4">
            {t("owners")}
          </Link>
        </nav>
        <div className="flex items-center gap-1.5 md:gap-2.5">
          <Suspense>
            <LanguageSwitcher />
          </Suspense>
          <Link
            href="/owners"
            className="hidden h-11 items-center rounded-full bg-text px-5 text-sm font-semibold text-white md:flex"
          >
            {t("addPlace")}
          </Link>
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
