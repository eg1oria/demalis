import type { ReactNode } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Header } from "@/components/Header";
import { TrackedLink } from "@/components/site/TrackedLink";
import { isFilled, LEGAL, phoneDigits } from "@/config/legal";
import type { AnalyticsEvent } from "@/lib/analytics";
import type { Locale } from "@/i18n/routing";
import { legalMetadata } from "@/lib/legalPage";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/contacts">) {
  return legalMetadata((await params).locale, "contacts");
}

/** Ссылка строится, только если поле в LEGAL заполнено (не «[ЗАПОЛНИТЬ: …]»). */
function contactHref(kind: "phone" | "whatsapp" | "telegram" | "email") {
  const value = LEGAL[kind];
  if (!isFilled(value)) return null;
  if (kind === "phone") return `tel:${phoneDigits(value)}`;
  if (kind === "whatsapp")
    return `https://wa.me/${phoneDigits(value).replace("+", "")}`;
  if (kind === "telegram") return `https://t.me/${value.replace(/^@/, "")}`;
  return `mailto:${value}`;
}

const EVENTS = {
  phone: "contact_phone",
  whatsapp: "contact_whatsapp",
  telegram: "contact_telegram",
  email: "contact_email",
} as const satisfies Record<string, AnalyticsEvent>;

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-line py-4 sm:flex-row sm:gap-6">
      <dt className="w-44 flex-none text-sm text-text-muted">{label}</dt>
      <dd className="text-[15px] break-words">{children}</dd>
    </div>
  );
}

/** «Контакты»: как связаться с сайтом и реквизиты (те же, что в подвале). */
export default async function ContactsPage({
  params,
}: PageProps<"/[locale]/contacts">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const [t, tl] = await Promise.all([
    getTranslations("Contacts"),
    getTranslations("Legal"),
  ]);

  const channels = (["phone", "whatsapp", "telegram", "email"] as const).map(
    (kind) => {
      const href = contactHref(kind);
      const external = kind === "whatsapp" || kind === "telegram";
      return (
        <Row key={kind} label={t(kind)}>
          {href ? (
            <TrackedLink
              href={href}
              event={EVENTS[kind]}
              {...(external && { target: "_blank", rel: "noopener" })}
              className="underline underline-offset-4 hover:text-text-secondary"
            >
              {LEGAL[kind]}
            </TrackedLink>
          ) : (
            LEGAL[kind]
          )}
        </Row>
      );
    },
  );

  const h2 = "font-display text-lg font-medium tracking-[-0.03em] md:text-xl";

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 pt-10 pb-4 md:pt-16">
        <h1 className="font-display text-[24px] leading-[1.1] font-medium tracking-[-0.04em] md:text-[40px]">
          {tl("contactsTitle")}
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-text-secondary">
          {t("lead")}
        </p>

        <section className="mt-10">
          <h2 className={h2}>{t("writeUs")}</h2>
          <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-5 text-[15px] text-text-secondary">
            {t("reasons")
              .split("|")
              .map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
          </ul>
          <dl className="mt-6 border-t border-line">
            {channels}
            <Row label={t("hours")}>{LEGAL.hours}</Row>
          </dl>
        </section>

        <section className="mt-12">
          <h2 className={h2}>{t("requisites")}</h2>
          <dl className="mt-4 border-t border-line">
            <Row label={t("operator")}>{LEGAL.operator}</Row>
            <Row label={t("bin")}>{LEGAL.bin}</Row>
            <Row label={t("address")}>{LEGAL.address}</Row>
          </dl>
        </section>
      </main>
    </>
  );
}
