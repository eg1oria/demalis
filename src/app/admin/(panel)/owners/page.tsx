import type { Metadata } from "next";
import Link from "next/link";
import { primaryButtonClass } from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Владельцы" };

export default async function OwnersPage() {
  await requireAdminPage();
  const { data: owners, error } = await createAdminClient()
    .from("owners")
    .select("id, name, phone, telegram_chat_id, link_code, places (id)")
    .order("name");
  if (error) throw error;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-serif text-2xl font-medium">Владельцы</h1>
        <Link href="/admin/owners/new" className={primaryButtonClass}>
          Добавить владельца
        </Link>
      </div>

      <ul className="flex flex-col gap-2">
        {owners.map((owner) => (
          <li
            key={owner.id}
            className="flex flex-col gap-1 rounded-[14px] border border-line-soft bg-surface p-3 sm:flex-row sm:items-center sm:gap-3"
          >
            <div className="flex min-w-0 flex-1 flex-col">
              <Link
                href={`/admin/owners/${owner.id}`}
                className="truncate font-medium hover:underline"
              >
                {owner.name}
              </Link>
              <span className="text-sm text-text-secondary">
                {[owner.phone, `объектов: ${owner.places.length}`]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </div>
            <span
              className={`self-start rounded-full px-3 py-1 text-xs font-medium sm:self-auto ${
                owner.telegram_chat_id
                  ? "bg-status-free-bg text-status-free-text"
                  : "bg-status-full-bg text-text-muted"
              }`}
            >
              {owner.telegram_chat_id
                ? "Бот подключён"
                : owner.link_code
                  ? "Код выдан"
                  : "Бот не подключён"}
            </span>
          </li>
        ))}
      </ul>
      {owners.length === 0 && (
        <p className="text-sm text-text-muted">Владельцев пока нет.</p>
      )}
    </div>
  );
}
