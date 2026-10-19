"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { adminApi } from "@/lib/api/client";
import type { AvailabilityStatus } from "@/lib/places/constants";
import type { FieldError, RawPlaceInput } from "@/lib/places/validate";

// ── Сохранение объекта ────────────────────────────────────────────────────

export type SavePlaceState = { errors?: FieldError[] };

/** Проверку полей, slug и фото делает бэкенд; ошибки — в том же виде, что у validatePlaceInput. */
export async function savePlace(
  _prev: SavePlaceState,
  formData: FormData,
): Promise<SavePlaceState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "") || null;
  const fields: RawPlaceInput = {};
  for (const [key, value] of formData.entries())
    if (typeof value === "string" && key !== "photos") fields[key] = value;

  let photos: unknown;
  try {
    photos = JSON.parse(String(formData.get("photos") ?? "[]"));
  } catch {
    photos = [];
  }

  const result = await adminApi<{ id: string } | { errors: FieldError[] }>(
    id ? `/admin/places/${id}` : "/admin/places",
    { method: id ? "PATCH" : "POST", body: { fields, photos } },
  );
  if ("errors" in result) return { errors: result.errors };

  revalidatePath("/admin");
  redirect(`/admin/places/${result.id}?saved=1`);
}

// ── Фото: подписанная ссылка для загрузки прямо из браузера в бэкенд ─────

export async function createPhotoUpload(
  contentType: string,
): Promise<{ path: string; url: string } | { error: string }> {
  await requireAdmin();
  const result = await adminApi<
    { path: string; token: string } | { error: string }
  >("/admin/photos/upload-url", { method: "POST", body: { contentType } });
  if ("error" in result) return result;
  const base = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
  return {
    path: result.path,
    url: `${base}/uploads/${result.path}?token=${encodeURIComponent(result.token)}`,
  };
}

// ── Занятость ─────────────────────────────────────────────────────────────

export async function setAvailability(
  placeId: string,
  date: string,
  status: AvailabilityStatus | null,
  unitId: string | null = null,
): Promise<{ error?: string; updatedAt?: string }> {
  await requireAdmin();
  const result = await adminApi<{ error?: string; updatedAt?: string }>(
    `/admin/places/${placeId}/availability/${date}`,
    { method: "PUT", body: { status, unit_id: unitId } },
  );
  // Статус объекта с домиками пересчитался — сайт должен увидеть сразу.
  if (!result.error) revalidatePath("/", "layout");
  return result;
}

// ── Домики ────────────────────────────────────────────────────────────────

export type UnitFormState = { error?: string; saved?: boolean };

/** Создать (без id) или изменить домик. Цены и места — как в форме. */
export async function saveUnit(
  placeId: string,
  unitId: string | null,
  formData: FormData,
): Promise<UnitFormState> {
  await requireAdmin();
  const body = Object.fromEntries(
    [
      "name_ru",
      "name_kk",
      "capacity",
      "price_weekday",
      "price_weekend",
      "price_holiday",
      "sort_order",
    ].map((key) => [key, String(formData.get(key) ?? "").replace(/\s/g, "")]),
  );
  body.name_ru = String(formData.get("name_ru") ?? "").trim();
  body.name_kk = String(formData.get("name_kk") ?? "").trim();
  const data = await adminApi<{ id: string } | { error: string }>(
    unitId ? `/admin/units/${unitId}` : `/admin/places/${placeId}/units`,
    { method: unitId ? "PATCH" : "POST", body },
  );
  if ("error" in data) return { error: data.error };
  revalidatePath(`/admin/places/${placeId}`);
  revalidatePath("/", "layout");
  return { saved: true };
}

export async function deleteUnit(
  placeId: string,
  unitId: string,
): Promise<{ error?: string }> {
  await requireAdmin();
  await adminApi(`/admin/units/${unitId}`, { method: "DELETE" });
  revalidatePath(`/admin/places/${placeId}`);
  revalidatePath("/", "layout");
  return {};
}

// ── Импорт CSV ────────────────────────────────────────────────────────────

export type ImportRowResult = {
  line: number;
  name: string;
  ok: boolean;
  errors: string[];
  id?: string;
};

export async function importPlaces(
  rows: { line: number; raw: RawPlaceInput }[],
): Promise<ImportRowResult[]> {
  await requireAdmin();
  if (rows.length > 1000) throw new Error("Не больше 1000 строк за раз");
  const results = await adminApi<ImportRowResult[]>("/admin/places/import", {
    method: "POST",
    body: { rows },
  });
  revalidatePath("/admin");
  return results;
}
