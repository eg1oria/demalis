import type { Metadata } from "next";
import Link from "next/link";
import {
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/admin/auth";
import {
  DIRECTIONS,
  PLACE_STATUSES,
  PLACE_TYPES,
  type PlaceStatus,
} from "@/lib/places/constants";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Объекты" };

const STATUS_BADGE: Record<PlaceStatus, string> = {
  published: "bg-status-free-bg text-status-free-text",
  draft: "bg-status-limited-bg text-status-limited-text",
  hidden: "bg-status-full-bg text-text-muted",
};

export default async function PlacesPage({
  searchParams,
}: PageProps<"/admin">) {
  await requireAdminPage();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const status =
    typeof params.status === "string" && params.status in PLACE_STATUSES
      ? (params.status as PlaceStatus)
      : null;

  const supabase = createAdminClient();
  let query = supabase
    .from("places")
    .select(
      "id, slug, name_ru, type, direction, status, price_from, updated_at",
    )
    .order("updated_at", { ascending: false });

  if (status) query = query.eq("status", status);
  // Символы, которые ломают синтаксис фильтра PostgREST, выкидываем.
  const safeQ = q.replace(/[,()*%"\\]/g, " ").trim();
  if (safeQ) query = query.or(`name_ru.ilike.*${safeQ}*,slug.ilike.*${safeQ}*`);

  const { data: places, error } = await query;
  if (error) throw error;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-serif text-2xl font-medium">Объекты</h1>
        <Link href="/admin/places/new" className={primaryButtonClass}>
          Добавить объект
        </Link>
      </div>

      <form className="flex flex-col gap-2 sm:flex-row">
        <input
          name="q"
          defaultValue={q}
          placeholder="Поиск по названию или адресу"
          className={inputClass}
        />
        <select
          name="status"
          defaultValue={status ?? ""}
          className={`${inputClass} sm:w-48`}
        >
          <option value="">Все статусы</option>
          {Object.entries(PLACE_STATUSES).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button type="submit" className={secondaryButtonClass}>
          Найти
        </button>
      </form>

      <p className="text-sm text-text-muted">Найдено: {places.length}</p>

      <ul className="flex flex-col gap-2">
        {places.map((place) => (
          <li
            key={place.id}
            className="flex flex-col gap-2 rounded-[14px] border border-line-soft bg-surface p-3 sm:flex-row sm:items-center"
          >
            <div className="flex min-w-0 flex-1 flex-col">
              <Link
                href={`/admin/places/${place.id}`}
                className="truncate font-medium hover:underline"
              >
                {place.name_ru}
              </Link>
              <span className="truncate text-sm text-text-secondary">
                {PLACE_TYPES[place.type]} · {DIRECTIONS[place.direction]}
                {place.price_from != null &&
                  ` · от ${place.price_from.toLocaleString("ru-RU")} ₸`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_BADGE[place.status]}`}
              >
                {PLACE_STATUSES[place.status]}
              </span>
              <Link
                href={`/admin/places/${place.id}/availability`}
                className="flex h-11 items-center px-2 text-sm text-accent"
              >
                Занятость
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
