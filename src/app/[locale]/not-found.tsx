import { useTranslations } from "next-intl";
import { Header } from "@/components/Header";
import { Landscape } from "@/components/site/Landscape";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("NotFound");

  return (
    <>
      <Header />
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-start gap-4 px-5 py-10">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl">
          <Landscape seed="not-found" hut={false} />
        </div>
        <h1 className="font-serif text-3xl font-medium">{t("title")}</h1>
        <p className="text-text-secondary">{t("text")}</p>
        <Link
          href="/catalog"
          className="flex h-13 items-center rounded-2xl bg-accent px-6 font-semibold text-white"
        >
          {t("toCatalog")}
        </Link>
      </main>
    </>
  );
}
