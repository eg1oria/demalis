import type { Metadata } from "next";
import Link from "next/link";
import { OwnerForm } from "@/components/admin/OwnerForm";
import { requireAdminPage } from "@/lib/admin/auth";

export const metadata: Metadata = { title: "Новый владелец" };

export default async function NewOwnerPage() {
  await requireAdminPage();
  return (
    <div className="flex flex-col gap-4">
      <Link href="/admin/owners" className="text-sm text-text-muted">
        ← Все владельцы
      </Link>
      <h1 className="font-serif text-2xl font-medium">Новый владелец</h1>
      <OwnerForm owner={null} />
      <p className="text-sm text-text-muted">
        После сохранения здесь появится кнопка «Создать код привязки», а объекты
        владельцу назначаются в карточке объекта.
      </p>
    </div>
  );
}
