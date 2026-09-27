import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { addDays } from "@/lib/dates";
import { getUpcomingWeekend } from "@/lib/weekend";

// Превью бота: как владелец видит даты. Статусы здесь — просто иллюстрация.
const PREVIEW = [
  { offset: 0, dot: "bg-owners-free", faded: false },
  { offset: 1, dot: "bg-owners-limited", faded: false },
  { offset: 2, dot: "bg-owners-full", faded: true },
] as const;

export function OwnersBlock() {
  const t = useTranslations("Owners");
  const locale = useLocale();
  const saturday = new Date(
    `${getUpcomingWeekend(new Date()).saturday}T00:00:00Z`,
  );
  const format = new Intl.DateTimeFormat(locale, {
    weekday: "short",
    timeZone: "UTC",
  });

  return (
    <section className="flex flex-col gap-3.5 rounded-3xl bg-owners-bg p-6 text-bg md:grid md:grid-cols-2 md:items-center md:gap-10 md:p-16">
      <div className="flex flex-col gap-3.5">
        <p className="text-xs font-semibold tracking-[0.1em] text-owners-eyebrow uppercase">
          {t("eyebrow")}
        </p>
        <h2 className="font-serif text-[26px] leading-[1.15] font-medium tracking-[-0.015em] text-white md:text-[44px]">
          {t("title")}
        </h2>
        <p className="text-[15px] leading-normal text-owners-text md:text-lg">
          {t("text")}
        </p>
      </div>
      <div className="flex flex-col gap-3.5 md:rounded-3xl md:bg-owners-surface md:p-6">
        <div className="mt-1 flex gap-2">
          {PREVIEW.map(({ offset, dot, faded }) => {
            const date = addDays(saturday, offset - 1);
            return (
              <div
                key={offset}
                className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-owners-tile text-sm font-semibold capitalize ${faded ? "text-owners-full" : ""}`}
              >
                <span className={`size-2 rounded-full ${dot}`} />
                {format.format(date)} {date.getUTCDate()}
              </div>
            );
          })}
        </div>
        <Link
          href="/owners#add"
          className="mt-1.5 flex h-13 items-center justify-center rounded-[14px] bg-white text-base font-semibold text-text"
        >
          {t("cta")}
        </Link>
      </div>
    </section>
  );
}
