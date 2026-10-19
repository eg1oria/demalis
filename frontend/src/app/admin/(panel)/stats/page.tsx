import type { Metadata } from "next";
import Link from "next/link";
import { inputClass, secondaryButtonClass } from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/admin/auth";
import { parseMonth, shiftMonth } from "@/lib/dates";
import { PLACE_STATUSES } from "@/lib/places/constants";
import { adminApi, query } from "@/lib/api/client";
import type { Tables } from "@/lib/api/types";

export const metadata: Metadata = { title: "Статистика" };

type Metric = { label: string; values: number[] };

/**
 * Статистика объектов: за 7 / 30 дней или за календарный месяц (?month=YYYY-MM).
 * Месячные цифры — те же, что в ежемесячном отчёте владельцу (Этап 9).
 */
export default async function StatsPage({
  searchParams,
}: PageProps<"/admin/stats">) {
  await requireAdminPage();
  const monthParam = (await searchParams).month;
  const month =
    typeof monthParam === "string" ? parseMonth(monthParam, new Date()) : null;

  type StatsPlace = Pick<Tables<"places">, "id" | "name_ru" | "status">;
  let places: StatsPlace[];
  let rows: { placeId: string; sort: number[]; metrics: Metric[] }[];
  if (month) {
    const stats = await adminApi<{
      places: StatsPlace[];
      rows: {
        place_id: string;
        views: number;
        whatsapp: number;
        phone: number;
        instagram: number;
        leads: number;
      }[];
    }>(`/admin/stats${query({ month })}`);
    places = stats.places;
    rows = stats.rows.map((s) => ({
      placeId: s.place_id,
      sort: [s.views, s.leads],
      metrics: [
        { label: "Просмотры", values: [s.views] },
        { label: "WhatsApp", values: [s.whatsapp] },
        { label: "Звонки", values: [s.phone] },
        { label: "Instagram", values: [s.instagram] },
        { label: "Заявки", values: [s.leads] },
      ],
    }));
  } else {
    const stats = await adminApi<{
      places: StatsPlace[];
      rows: (Record<
        | "views_7"
        | "views_30"
        | "whatsapp_7"
        | "whatsapp_30"
        | "phone_7"
        | "phone_30"
        | "instagram_7"
        | "instagram_30"
        | "leads_7"
        | "leads_30",
        number
      > & { place_id: string })[];
    }>("/admin/stats");
    places = stats.places;
    rows = stats.rows.map((s) => ({
      placeId: s.place_id,
      sort: [s.views_30, s.leads_30],
      metrics: [
        { label: "Просмотры", values: [s.views_7, s.views_30] },
        { label: "WhatsApp", values: [s.whatsapp_7, s.whatsapp_30] },
        { label: "Звонки", values: [s.phone_7, s.phone_30] },
        { label: "Instagram", values: [s.instagram_7, s.instagram_30] },
        { label: "Заявки", values: [s.leads_7, s.leads_30] },
      ],
    }));
  }

  const byId = new Map(places.map((p) => [p.id, p]));
  const list = rows
    .flatMap((r) => {
      const place = byId.get(r.placeId);
      return place ? [{ ...r, place }] : [];
    })
    .sort(
      (a, b) =>
        b.sort[0] - a.sort[0] ||
        b.sort[1] - a.sort[1] ||
        a.place.name_ru.localeCompare(b.place.name_ru, "ru"),
    );

  const monthLabel =
    month &&
    new Date(`${month}-01T00:00:00Z`).toLocaleDateString("ru-RU", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-xl font-medium tracking-[-0.03em]">
        Статистика
      </h1>

      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/admin/stats"
          className={`${secondaryButtonClass} ${month ? "" : "border-text"}`}
        >
          7 / 30 дней
        </Link>
        <form className="flex flex-wrap items-center gap-2">
          <input
            type="month"
            name="month"
            defaultValue={
              month ?? shiftMonth(parseMonth(undefined, new Date()), -1)
            }
            className={`${inputClass} w-44`}
          />
          <button
            type="submit"
            className={`${secondaryButtonClass} ${month ? "border-text" : ""}`}
          >
            За месяц
          </button>
        </form>
      </div>

      <p className="text-sm text-text-muted">
        {month
          ? `За ${monthLabel} (по времени Алматы). Эти же цифры приходят владельцу в ежемесячном отчёте.`
          : "За 7 / 30 дней."}{" "}
        Просмотр считается не чаще раза в 30 минут с одного браузера, роботы не
        учитываются.
      </p>

      <ul className="flex flex-col gap-2">
        {list.map((row) => (
          <li
            key={row.placeId}
            className="flex flex-col gap-2 rounded-[14px] border border-line-soft bg-surface p-3 sm:flex-row sm:items-center"
          >
            <div className="min-w-0 flex-1">
              <Link
                href={`/admin/places/${row.placeId}`}
                className="font-medium hover:underline"
              >
                {row.place.name_ru}
              </Link>
              {row.place.status !== "published" && (
                <span className="ml-2 text-xs text-text-muted">
                  {PLACE_STATUSES[row.place.status]}
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm sm:w-[34rem] sm:grid-cols-5">
              {row.metrics.map(({ label, values: [first, second] }) => (
                <div key={label} className="flex flex-col">
                  <span className="text-xs text-text-muted">{label}</span>
                  <span className="tabular-nums">
                    {first}
                    {second !== undefined && (
                      <span className="text-text-faint"> / {second}</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
