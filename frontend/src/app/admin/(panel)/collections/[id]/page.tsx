import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CollectionForm } from "@/components/admin/CollectionForm";
import { requireAdminPage } from "@/lib/admin/auth";
import { catalogHref } from "@/lib/catalog/filters";
import { findPlaces } from "@/lib/catalog/query";
import { collectionFilters } from "@/lib/collections";
import { apiOrNull } from "@/lib/api/client";
import type { Tables } from "@/lib/api/types";

export const metadata: Metadata = { title: "Подборка" };

const UUID = /^[0-9a-f-]{36}$/i;

export default async function EditCollectionPage({
  params,
  searchParams,
}: PageProps<"/admin/collections/[id]">) {
  await requireAdminPage();
  const { id } = await params;
  const { saved } = await searchParams;
  if (!UUID.test(id)) notFound();

  const collection = await apiOrNull<Tables<"collections">>(
    `/admin/collections/${id}`,
    { admin: true },
  );
  if (!collection) notFound();

  const filters = collectionFilters(collection.filters);
  const { total } = await findPlaces(filters);

  return (
    <div className="flex flex-col gap-4">
      <Link href="/admin/collections" className="text-sm text-text-muted">
        ← Все подборки
      </Link>
      <h1 className="font-display text-xl font-medium tracking-[-0.03em]">
        {collection.title_ru}
      </h1>
      {saved && (
        <p
          role="status"
          className="rounded-[14px] bg-status-free-bg p-3 text-status-free-text"
        >
          Сохранено
        </p>
      )}
      <p className="text-sm text-text-secondary">
        Сейчас подходит объектов: {total}.{" "}
        <a
          href={`/ru/collections/${collection.slug}`}
          target="_blank"
          rel="noopener"
          className="text-accent"
        >
          Открыть на сайте
        </a>{" "}
        ·{" "}
        <a
          href={`/ru${catalogHref(filters)}`}
          target="_blank"
          rel="noopener"
          className="text-accent"
        >
          Эти фильтры в каталоге
        </a>
      </p>
      {/* key: после сохранения форма перечитывает свежие данные */}
      <CollectionForm key={collection.updated_at} collection={collection} />
    </div>
  );
}
