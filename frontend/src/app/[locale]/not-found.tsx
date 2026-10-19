import { useTranslations } from "next-intl";
import { Header } from "@/components/Header";
import { ArrowRightIcon } from "@/components/site/Icons";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("NotFound");

  return (
    <>
      <Header />
      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col items-start gap-5 px-5 pt-16 md:px-10 md:pt-28 lg:px-20">
        <p className="tabular font-display text-[64px] leading-none font-medium tracking-[-0.05em] text-line-strong md:text-[120px]">
          404
        </p>
        <h1 className="font-display text-2xl font-medium tracking-[-0.03em] md:text-3xl">
          {t("title")}
        </h1>
        <p className="max-w-md text-text-secondary">{t("text")}</p>
        <Link
          href="/catalog"
          className="mt-2 flex h-12 items-center gap-2 rounded-[10px] bg-text px-5 text-[15px] font-medium text-white"
        >
          {t("toCatalog")}
          <ArrowRightIcon size={18} />
        </Link>
      </main>
    </>
  );
}
