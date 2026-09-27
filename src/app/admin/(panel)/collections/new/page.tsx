import type { Metadata } from "next";
import Link from "next/link";
import { CollectionForm } from "@/components/admin/CollectionForm";
import { requireAdminPage } from "@/lib/admin/auth";

export const metadata: Metadata = { title: "Новая подборка" };

export default async function NewCollectionPage() {
  await requireAdminPage();
  return (
    <div className="flex flex-col gap-4">
      <Link href="/admin/collections" className="text-sm text-text-muted">
        ← Все подборки
      </Link>
      <h1 className="font-serif text-2xl font-medium">Новая подборка</h1>
      <CollectionForm collection={null} />
    </div>
  );
}
