import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { addDays } from "@/lib/dates";
import { getUpcomingWeekend } from "@/lib/weekend";
import { ArrowRightIcon } from "./Icons";

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
    <section className="flex flex-col gap-8 rounded-2xl bg-owners-bg px-6 py-8 text-bg md:grid md:grid-cols-[1.2fr_1fr] md:items-end md:gap-16 md:p-14">
      <div className="flex flex-col gap-4">
        <p className="text-[11px] font-medium tracking-[0.14em] text-owners-eyebrow uppercase">
          {t("eyebrow")}
        </p>
        <h2 className="font-display text-[26px] leading-[1.1] font-medium tracking-[-0.035em] text-white md:text-[40px]">
          {t("title")}
        </h2>
        <p className="max-w-md text-[15px] leading-relaxed text-owners-text md:text-base">
          {t("text")}
        </p>
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex gap-px overflow-hidden rounded-[10px] border border-white/10">
          {PREVIEW.map(({ offset, dot, faded }) => {
            const date = addDays(saturday, offset - 1);
            return (
              <div
                key={offset}
                className={`flex h-12 flex-1 items-center justify-center gap-2 bg-owners-tile text-sm capitalize ${faded ? "text-owners-full" : ""}`}
              >
                <span className={`size-1.5 rounded-full ${dot}`} />
                {format.format(date)} {date.getUTCDate()}
              </div>
            );
          })}
        </div>
        <Link
          href="/owners#add"
          className="flex h-13 items-center justify-center gap-2 rounded-[10px] bg-white text-[15px] font-medium text-text transition-opacity hover:opacity-90"
        >
          {t("cta")}
          <ArrowRightIcon size={18} />
        </Link>
      </div>
    </section>
  );
}
