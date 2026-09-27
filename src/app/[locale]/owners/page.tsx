import { getTranslations, setRequestLocale } from "next-intl/server";
import { Header } from "@/components/Header";
import type { Locale } from "@/i18n/routing";

// Заглушка: полноценный лендинг для владельцев — Этап 7.
export default async function OwnersPage({
  params,
}: PageProps<"/[locale]/owners">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("Owners");

  return (
    <>
      <Header />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-3 px-5 py-12">
        <p className="text-xs font-semibold tracking-[0.1em] text-text-muted uppercase">
          {t("eyebrow")}
        </p>
        <h1 className="font-serif text-4xl font-medium">{t("stubTitle")}</h1>
        <p className="text-lg text-text-secondary">{t("stubText")}</p>
      </main>
    </>
  );
}
