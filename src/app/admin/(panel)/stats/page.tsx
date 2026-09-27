import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminPage } from "@/lib/admin/auth";
import { PLACE_STATUSES } from "@/lib/places/constants";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Статистика" };

export default async function StatsPage() {
  await requireAdminPage();
  const supabase = createAdminClient();
  const [stats, places] = await Promise.all([
    supabase.rpc("place_stats"),
    supabase.from("places").select("id, name_ru, status"),
  ]);
  if (stats.error) throw stats.error;
  if (places.error) throw places.error;

  const byId = new Map(places.data.map((p) => [p.id, p]));
  const rows = stats.data
    .flatMap((s) => {
      const place = byId.get(s.place_id);
      return place ? [{ ...s, place }] : [];
    })
    .sort(
      (a, b) =>
        b.views_30 - a.views_30 ||
        b.leads_30 - a.leads_30 ||
        a.place.name_ru.localeCompare(b.place.name_ru, "ru"),
    );

  const metric = (label: string, week: number, month: number) => (
    <div className="flex flex-col">
      <span className="text-xs text-text-muted">{label}</span>
      <span className="tabular-nums">
        {week} <span className="text-text-faint">/ {month}</span>
      </span>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-serif text-2xl font-medium">Статистика</h1>
      <p className="text-sm text-text-muted">
        За 7 / 30 дней. Просмотр считается не чаще раза в 30 минут с одного
        браузера, роботы не учитываются.
      </p>

      <ul className="flex flex-col gap-2">
        {rows.map((row) => (
          <li
            key={row.place_id}
            className="flex flex-col gap-2 rounded-[14px] border border-line-soft bg-surface p-3 sm:flex-row sm:items-center"
          >
            <div className="min-w-0 flex-1">
              <Link
                href={`/admin/places/${row.place_id}`}
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
            <div className="grid grid-cols-3 gap-2 text-sm sm:w-96">
              {metric("Просмотры", row.views_7, row.views_30)}
              {metric("WhatsApp", row.whatsapp_7, row.whatsapp_30)}
              {metric("Заявки", row.leads_7, row.leads_30)}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
