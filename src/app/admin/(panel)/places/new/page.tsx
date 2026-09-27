import type { Metadata } from "next";
import Link from "next/link";
import { PlaceForm } from "@/components/admin/PlaceForm";
import { requireAdminPage } from "@/lib/admin/auth";
import { listOwners } from "../owners";

export const metadata: Metadata = { title: "Новый объект" };

export default async function NewPlacePage() {
  await requireAdminPage();
  const owners = await listOwners();

  return (
    <div className="flex flex-col gap-4">
      <Link href="/admin" className="text-sm text-text-muted">
        ← Все объекты
      </Link>
      <h1 className="font-serif text-2xl font-medium">Новый объект</h1>
      <PlaceForm place={null} owners={owners} />
    </div>
  );
}
