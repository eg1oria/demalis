import type { Metadata } from "next";
import { HolidayRowForm } from "@/components/admin/HolidayRowForm";
import { HolidaySurveyButton } from "@/components/admin/HolidaySurveyButton";
import { inputClass, secondaryButtonClass } from "@/components/admin/ui";
import { TIME_ZONE } from "@/config/site";
import { requireAdminPage } from "@/lib/admin/auth";
import { adminApi, query } from "@/lib/api/client";
import { almatyToday, isIsoDate, toIsoDate } from "@/lib/dates";
import type { AvailabilityStatus } from "@/lib/places/constants";

export const metadata: Metadata = { title: "Праздники" };

type HolidayRow = {
  place_id: string;
  name_ru: string;
  slug: string;
  owner_name: string | null;
  bot_linked: boolean;
  status: AvailabilityStatus | null;
  price: number | null;
  updated_at: string | null;
};

const updatedFormat = new Intl.DateTimeFormat("ru-RU", {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

/** Ближайший Новый год: ночь 31.12 этого года. */
const newYearNight = (now: Date) =>
  `${toIsoDate(almatyToday(now)).slice(0, 4)}-12-31`;

export default async function HolidaysPage({
  searchParams,
}: PageProps<"/admin/holidays">) {
  await requireAdminPage();
  const params = await searchParams;
  const night =
    typeof params.night === "string" && isIsoDate(params.night)
      ? params.night
      : newYearNight(new Date());

  const rows = await adminApi<HolidayRow[]>(
    `/admin/holidays${query({ night })}`,
  );
  const answered = rows.filter((r) => r.status).length;
  const linked = rows.filter((r) => r.bot_linked).length;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-xl font-medium tracking-[-0.03em]">
        Праздники
      </h1>
      <p className="text-sm text-text-secondary">
        Опрос владельцев про одну ночь: бот спрашивает, есть ли места, и цену.
        Ответы сразу видны на сайте — в каталоге на эту дату и в подборке с этой
        ночью (например, «Новый год за городом»). Тем, у кого нет бота, можно
        позвонить и отметить здесь.
      </p>

      <form className="flex flex-col gap-2 sm:flex-row">
        <input
          type="date"
          name="night"
          defaultValue={night}
          aria-label="Ночь (заезд)"
          className={`${inputClass} sm:w-48`}
        />
        <button type="submit" className={secondaryButtonClass}>
          Показать
        </button>
      </form>

      <p className="text-sm text-text-secondary">
        Ответили: {answered} из {rows.length} · с ботом: {linked}
      </p>
      <HolidaySurveyButton night={night} />

      <ul className="flex flex-col divide-y divide-line rounded-2xl border border-line bg-surface">
        {rows.map((row) => (
          <li
            key={row.place_id}
            className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex flex-col gap-0.5">
              <a
                href={`/ru/place/${row.slug}`}
                target="_blank"
                rel="noopener"
                className="font-medium hover:underline"
              >
                {row.name_ru}
              </a>
              <span className="text-xs text-text-muted">
                {row.owner_name ?? "без владельца"}
                {" · "}
                {row.bot_linked ? "бот подключён" : "без бота"}
                {row.updated_at &&
                  ` · обновлено ${updatedFormat.format(new Date(row.updated_at))}`}
              </span>
            </div>
            <HolidayRowForm
              key={`${night}-${row.updated_at}`}
              placeId={row.place_id}
              night={night}
              status={row.status}
              price={row.price}
            />
          </li>
        ))}
        {rows.length === 0 && (
          <li className="p-4 text-sm text-text-muted">
            Нет опубликованных объектов.
          </li>
        )}
      </ul>
    </div>
  );
}
