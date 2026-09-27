import { useTranslations } from "next-intl";
import { SITE_NAME } from "@/config/site";
import { Link } from "@/i18n/navigation";
import { Logo } from "./Logo";

export function Footer() {
  const t = useTranslations("Footer");
  const h = useTranslations("Header");

  return (
    <footer className="mx-auto flex w-full max-w-[1440px] flex-col gap-3.5 px-5 pt-8 pb-10 md:px-20">
      <Logo size="sm" />
      <p className="text-sm leading-normal text-text-muted">{t("tagline")}</p>
      <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <Link
          href="/catalog"
          className="flex min-h-8 items-center text-text-secondary"
        >
          {h("catalog")}
        </Link>
        <Link
          href="/owners"
          className="flex min-h-8 items-center text-text-secondary"
        >
          {h("owners")}
        </Link>
      </nav>
      <p className="text-[13px] text-text-faint lowercase">
        © {new Date().getFullYear()} {SITE_NAME}
      </p>
    </footer>
  );
}
