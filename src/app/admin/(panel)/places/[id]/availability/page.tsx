import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AvailabilityGrid } from "@/components/admin/AvailabilityGrid";
import { requireAdminPage } from "@/lib/admin/auth";
import { nextDays } from "@/lib/dates";
import { AVAILABILITY_DAYS } from "@/lib/places/constants";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Занятость" };

export default async function AvailabilityPage({
  params,
}: PageProps<"/admin/places/[id]/availability">) {
  await requireAdminPage();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const days = nextDays(new Date(), AVAILABILITY_DAYS);
  const supabase = createAdminClient();
  const [{ data: place }, { data: rows, error }] = await Promise.all([
    supabase.from("places").select("id, name_ru").eq("id", id).maybeSingle(),
    supabase
      .from("availability")
      .select("date, status, updated_at")
      .eq("place_id", id)
      .gte("date", days[0])
      .lte("date", days[days.length - 1]),
  ]);
  if (error) throw error;
  if (!place) notFound();

  return (
    <div className="flex flex-col gap-4">
      <Link
        href={`/admin/places/${place.id}`}
        className="text-sm text-text-muted"
      >
        ← {place.name_ru}
      </Link>
      <h1 className="font-serif text-2xl font-medium">Занятость на 60 дней</h1>
      <p className="text-text-secondary">
        Нажмите на день, чтобы сменить статус: нет данных → свободно → мало мест
        → занято → нет данных. Сохраняется сразу.
      </p>
      <AvailabilityGrid placeId={place.id} days={days} initial={rows ?? []} />
    </div>
  );
}
