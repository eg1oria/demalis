import { useLocale, useTranslations } from "next-intl";
import { formatTenge, splitMinutes } from "@/lib/format";

/** Подписи «55 мин», «1 ч 10 мин», «от 42 000 ₸» в текущем языке. */
export function useFormat() {
  const t = useTranslations("Format");
  const locale = useLocale();

  return {
    drive(minutes: number) {
      const { h, m } = splitMinutes(minutes);
      if (h === 0) return t("minutes", { m });
      return m === 0 ? t("hours", { h }) : t("hoursMinutes", { h, m });
    },
    tenge: (amount: number) => formatTenge(amount, locale),
    priceFrom: (amount: number) =>
      t("priceFrom", { price: formatTenge(amount, locale) }),
    t,
  };
}
