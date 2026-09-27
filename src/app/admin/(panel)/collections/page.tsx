import type { Metadata } from "next";
import Link from "next/link";
import { primaryButtonClass } from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Подборки" };

export default async function CollectionsPage() {
  await requireAdminPage();
  const { data: collections, error } = await createAdminClient()
    .from("collections")
    .select("id, slug, title_ru, filters, sort_order, published")
    .order("sort_order")
    .order("title_ru");
  if (error) throw error;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-serif text-2xl font-medium">Подборки</h1>
        <Link href="/admin/collections/new" className={primaryButtonClass}>
          Добавить подборку
        </Link>
      </div>
      <p className="text-sm text-text-muted">
        На главной показываются первые 4 опубликованные.
      </p>
      <ul className="flex flex-col gap-2">
        {collections.map((c) => (
          <li
            key={c.id}
            className="flex flex-col gap-1 rounded-[14px] border border-line-soft bg-surface p-3 sm:flex-row sm:items-center sm:gap-3"
          >
            <span className="w-8 text-sm text-text-muted tabular-nums">
              {c.sort_order}
            </span>
            <div className="flex min-w-0 flex-1 flex-col">
              <Link
                href={`/admin/collections/${c.id}`}
                className="truncate font-medium hover:underline"
              >
                {c.title_ru}
              </Link>
              <span className="truncate text-sm text-text-secondary">
                /collections/{c.slug} · {c.filters || "все объекты"}
              </span>
            </div>
            {!c.published && (
              <span className="self-start rounded-full bg-status-full-bg px-3 py-1 text-xs font-medium text-text-muted sm:self-auto">
                Скрыта
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
