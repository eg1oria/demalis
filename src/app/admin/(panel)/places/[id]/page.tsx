import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PaymentsSection } from "@/components/admin/PaymentsSection";
import { PlaceForm } from "@/components/admin/PlaceForm";
import { requireAdminPage } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { listOwners } from "../owners";

export const metadata: Metadata = { title: "Объект" };

const UUID = /^[0-9a-f-]{36}$/i;

export default async function EditPlacePage({
  params,
  searchParams,
}: PageProps<"/admin/places/[id]">) {
  await requireAdminPage();
  const { id } = await params;
  const { saved } = await searchParams;
  if (!UUID.test(id)) notFound();

  const [{ data: place, error }, owners] = await Promise.all([
    createAdminClient().from("places").select("*").eq("id", id).maybeSingle(),
    listOwners(),
  ]);
  if (error) throw error;
  if (!place) notFound();

  return (
    <div className="flex flex-col gap-4">
      <Link href="/admin" className="text-sm text-text-muted">
        ← Все объекты
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-serif text-2xl font-medium">{place.name_ru}</h1>
        <Link
          href={`/admin/places/${place.id}/availability`}
          className="flex h-11 items-center text-accent"
        >
          Занятость на 60 дней →
        </Link>
      </div>
      {saved && (
        <p
          role="status"
          className="rounded-[14px] bg-status-free-bg p-3 text-status-free-text"
        >
          Сохранено
        </p>
      )}
      {/* key: после сохранения форма перечитывает свежие данные */}
      <PlaceForm key={place.updated_at} place={place} owners={owners} />
      <PaymentsSection placeId={place.id} />
    </div>
  );
}
