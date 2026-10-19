import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AvailabilityGrid } from "@/components/admin/AvailabilityGrid";
import { requireAdminPage } from "@/lib/admin/auth";
import { nextDays } from "@/lib/dates";
import { AVAILABILITY_DAYS } from "@/lib/places/constants";
import { adminApi, apiOrNull, ApiError, query } from "@/lib/api/client";
import type { Tables } from "@/lib/api/types";

export const metadata: Metadata = { title: "Занятость" };

export default async function AvailabilityPage({
  params,
  searchParams,
}: PageProps<"/admin/places/[id]/availability">) {
  await requireAdminPage();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { unit: unitParam } = await searchParams;

  const days = nextDays(new Date(), AVAILABILITY_DAYS);
  // С домиками сетка — по одному домику (по умолчанию первому).
  const units =
    (await apiOrNull<Tables<"units">[]>(`/admin/places/${id}/units`, {
      admin: true,
    })) ?? [];
  const unit =
    units.find((u) => u.id === unitParam) ?? (units.length ? units[0] : null);
  const { place, rows } = await adminApi<{
    place: { id: string; name_ru: string };
    rows: Pick<Tables<"availability">, "date" | "status" | "updated_at">[];
  }>(
    `/admin/places/${id}/availability${query({ from: days[0], to: days[days.length - 1], unit: unit?.id })}`,
  ).catch((e) => {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  });

  return (
    <div className="flex flex-col gap-4">
      <Link
        href={`/admin/places/${place.id}`}
        className="text-sm text-text-muted"
      >
        ← {place.name_ru}
      </Link>
      <h1 className="font-display text-xl font-medium tracking-[-0.03em]">
        Занятость на 60 дней
      </h1>
      <p className="text-text-secondary">
        Нажмите на день, чтобы сменить статус: нет данных → свободно → мало мест
        → занято → нет данных. Сохраняется сразу.
      </p>
      {unit && (
        <>
          <p className="text-sm text-text-secondary">
            У объекта есть домики: отмечайте каждый. Статус объекта на сайте
            считается сам (все свободны — «Свободно», часть — «Мало мест»).
          </p>
          <nav className="flex flex-wrap gap-2">
            {units.map((u) => (
              <Link
                key={u.id}
                href={`/admin/places/${place.id}/availability?unit=${u.id}`}
                className={`flex h-11 items-center rounded-full border px-4 text-sm ${
                  u.id === unit.id
                    ? "border-text bg-text text-white"
                    : "border-line bg-surface"
                }`}
              >
                {u.name_ru} · {u.capacity} мест
              </Link>
            ))}
          </nav>
        </>
      )}
      <AvailabilityGrid
        key={unit?.id ?? "place"}
        placeId={place.id}
        unitId={unit?.id ?? null}
        days={days}
        initial={rows ?? []}
      />
    </div>
  );
}
