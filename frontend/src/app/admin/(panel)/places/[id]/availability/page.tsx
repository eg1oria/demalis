import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AvailabilityGrid } from "@/components/admin/AvailabilityGrid";
import { requireAdminPage } from "@/lib/admin/auth";
import { nextDays } from "@/lib/dates";
import { AVAILABILITY_DAYS } from "@/lib/places/constants";
import { adminApi, ApiError, query } from "@/lib/api/client";
import type { Tables } from "@/lib/api/types";

export const metadata: Metadata = { title: "Занятость" };

export default async function AvailabilityPage({
  params,
}: PageProps<"/admin/places/[id]/availability">) {
  await requireAdminPage();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const days = nextDays(new Date(), AVAILABILITY_DAYS);
  const { place, rows } = await adminApi<{
    place: { id: string; name_ru: string };
    rows: Pick<Tables<"availability">, "date" | "status" | "updated_at">[];
  }>(
    `/admin/places/${id}/availability${query({ from: days[0], to: days[days.length - 1] })}`,
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
      <AvailabilityGrid placeId={place.id} days={days} initial={rows ?? []} />
    </div>
  );
}
