import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Header } from "@/components/Header";
import { OwnerRequestForm } from "@/components/owners/OwnerRequestForm";
import { PRICING } from "@/config/pricing";
import type { Locale } from "@/i18n/routing";
import { formatTenge } from "@/lib/format";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/owners">): Promise<Metadata> {
  const { locale } = await params;
  const [tm, t] = await Promise.all([
    getTranslations({ locale: locale as Locale, namespace: "Metadata" }),
    getTranslations({ locale: locale as Locale, namespace: "OwnersPage" }),
  ]);
  return pageMetadata({
    locale,
    path: "/owners",
    title: tm("ownersTitle"),
    description: t("lead"),
  });
}

const h2 =
  "font-serif text-[26px] leading-[1.15] font-medium tracking-[-0.015em] md:text-[38px] md:leading-[1.1]";

function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`mt-0.5 flex-none text-accent ${className}`}
    >
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

/** Лендинг для владельцев (Этап 7): зачем, как, тарифы без оплаты, вопросы, форма. */
export default async function OwnersPage({
  params,
}: PageProps<"/[locale]/owners">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("OwnersPage");

  const steps = [1, 2, 3] as const;
  const benefits = [1, 2, 3, 4, 5, 6] as const;
  const faq = [1, 2, 3, 4, 5, 6] as const;

  return (
    <>
      <Header />
      <main className="mx-auto flex w-full max-w-[1440px] flex-col px-5 md:px-20">
        {/* Проблема и главное действие */}
        <section className="pt-6 md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-16 md:pt-12">
          <div>
            <p className="text-xs font-semibold tracking-[0.1em] text-text-muted uppercase">
              {t("eyebrow")}
            </p>
            <h1 className="mt-3 font-serif text-[34px] leading-[1.08] font-medium tracking-[-0.025em] md:text-6xl">
              {t("title")}
            </h1>
            <p className="mt-4 max-w-xl text-base leading-normal text-text-secondary md:text-xl">
              {t("lead")}
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <a
                href="#add"
                className="flex h-13 items-center rounded-2xl bg-accent px-5 text-[15px] font-semibold text-white"
              >
                {t("cta")}
              </a>
              <a
                href="#pricing"
                className="flex h-13 items-center rounded-2xl border border-line-strong bg-surface px-5 text-[15px] font-semibold"
              >
                {t("ctaPricing")}
              </a>
            </div>
          </div>
          <div className="mt-8 rounded-3xl border border-line-soft bg-surface p-5 md:mt-0 md:p-8">
            <h2 className="font-serif text-xl font-medium">
              {t("problemTitle")}
            </h2>
            <ul className="mt-3 flex flex-col gap-3 text-[15px] leading-normal text-text-secondary">
              {([1, 2, 3] as const).map((i) => (
                <li key={i} className="flex gap-3">
                  <span
                    className="mt-2 size-1.5 flex-none rounded-full bg-text-muted"
                    aria-hidden="true"
                  />
                  {t(`problem${i}`)}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Как это работает */}
        <section className="mt-12 md:mt-20">
          <h2 className={h2}>{t("stepsTitle")}</h2>
          <ol className="mt-5 grid gap-3 md:mt-8 md:grid-cols-3 md:gap-6">
            {steps.map((i) => (
              <li
                key={i}
                className="flex flex-col gap-2 rounded-3xl border border-line-soft bg-surface p-5"
              >
                <span className="flex size-9 items-center justify-center rounded-full bg-surface-muted text-sm font-semibold">
                  {i}
                </span>
                <h3 className="mt-1 text-lg font-semibold">
                  {t(`step${i}Title`)}
                </h3>
                <p className="text-[15px] leading-normal text-text-secondary">
                  {t(`step${i}Text`)}
                </p>
              </li>
            ))}
          </ol>
        </section>

        {/* Что получает владелец */}
        <section className="mt-12 md:mt-20">
          <h2 className={h2}>{t("benefitsTitle")}</h2>
          <ul className="mt-5 grid gap-x-8 gap-y-3 md:mt-8 md:grid-cols-2">
            {benefits.map((i) => (
              <li
                key={i}
                className="flex gap-3 text-[15px] leading-normal md:text-base"
              >
                <CheckIcon />
                {t(`benefit${i}`)}
              </li>
            ))}
          </ul>
        </section>

        {/* Тарифы: без оплаты на сайте, только заявка */}
        <section id="pricing" className="mt-12 scroll-mt-4 md:mt-20">
          <h2 className={h2}>{t("pricingTitle")}</h2>
          <p className="mt-2 max-w-2xl text-[15px] text-text-secondary">
            {t("pricingNote")}
          </p>
          <ul className="mt-5 grid gap-3 md:mt-8 md:grid-cols-2 md:gap-6 xl:grid-cols-4">
            {PRICING.map((plan) => (
              <li
                key={plan.id}
                className="flex flex-col gap-4 rounded-3xl border border-line-soft bg-surface p-5"
              >
                <div>
                  <h3 className="text-lg font-semibold">
                    {t(`plan_${plan.id}`)}
                  </h3>
                  <p className="mt-1">
                    <span className="font-serif text-[28px] font-medium tracking-[-0.02em]">
                      {formatTenge(plan.price, locale)}
                    </span>{" "}
                    <span className="text-sm text-text-muted">
                      {t(`period_${plan.period ?? "free"}`)}
                    </span>
                  </p>
                </div>
                <ul className="flex flex-1 flex-col gap-2 text-sm text-text-secondary">
                  {t(`plan_${plan.id}_features`)
                    .split("|")
                    .map((feature) => (
                      <li key={feature} className="flex gap-2.5">
                        <CheckIcon />
                        {feature}
                      </li>
                    ))}
                </ul>
                <a
                  href="#add"
                  className="flex h-12 items-center justify-center rounded-[14px] border border-line-strong text-[15px] font-semibold"
                >
                  {t("choosePlan")}
                </a>
              </li>
            ))}
          </ul>
        </section>

        {/* Частые вопросы */}
        <section className="mt-12 md:mt-20">
          <h2 className={h2}>{t("faqTitle")}</h2>
          <div className="mt-5 flex max-w-3xl flex-col border-t border-line md:mt-8">
            {faq.map((i) => (
              <details key={i} className="group border-b border-line">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 text-base font-semibold [&::-webkit-details-marker]:hidden">
                  {t(`faq${i}Q`)}
                  <span
                    aria-hidden="true"
                    className="text-xl text-text-muted group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="pb-4 text-[15px] leading-normal text-text-secondary">
                  {t(`faq${i}A`)}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* Форма «Добавить объект» */}
        <section
          id="add"
          className="mt-12 scroll-mt-4 md:mt-20 md:grid md:grid-cols-2 md:gap-16"
        >
          <div>
            <h2 className={h2}>{t("formTitle")}</h2>
            <p className="mt-2 text-[15px] leading-normal text-text-secondary md:text-lg">
              {t("formLead")}
            </p>
          </div>
          <div className="mt-5 md:mt-0">
            <OwnerRequestForm />
          </div>
        </section>
      </main>
    </>
  );
}
