"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { normalizeCollectionFilters } from "@/lib/collections";
import { isValidSlug, slugify } from "@/lib/slug";
import { adminApi, ApiError } from "@/lib/api/client";

export type SaveCollectionState = { error?: string };

const text = (formData: FormData, key: string) =>
  String(formData.get(key) ?? "").trim();

export async function saveCollection(
  _prev: SaveCollectionState,
  formData: FormData,
): Promise<SaveCollectionState> {
  await requireAdmin();
  const id = text(formData, "id") || null;
  const title_ru = text(formData, "title_ru");
  if (!title_ru) return { error: "Укажите заголовок на русском" };
  const slug = text(formData, "slug") || slugify(title_ru);
  if (!isValidSlug(slug))
    return {
      error: "Адрес (slug): только латиница, цифры и дефисы, например s-chanom",
    };
  const sortOrder = Number(text(formData, "sort_order") || 100);
  if (!Number.isInteger(sortOrder)) return { error: "Порядок — целое число" };

  const row = {
    slug,
    title_ru,
    title_kk: text(formData, "title_kk") || null,
    intro_ru: text(formData, "intro_ru") || null,
    intro_kk: text(formData, "intro_kk") || null,
    filters: normalizeCollectionFilters(text(formData, "filters")),
    sort_order: sortOrder,
    published: formData.get("published") === "on",
  };

  let data: { id: string } | { error: string };
  try {
    data = await adminApi(
      id ? `/admin/collections/${id}` : "/admin/collections",
      {
        method: id ? "PATCH" : "POST",
        body: row,
      },
    );
  } catch (e) {
    if (e instanceof ApiError && e.status === 409)
      return { error: `Адрес «${slug}» уже занят другой подборкой` };
    throw e;
  }
  if ("error" in data) return { error: data.error };

  // Подборки видны на главной, на своих страницах и в sitemap.
  revalidatePath("/", "layout");
  redirect(`/admin/collections/${data.id}?saved=1`);
}
