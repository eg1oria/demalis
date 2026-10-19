"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PLAN_FEATURES } from "@/config/pricing";
import { requireAdmin } from "@/lib/admin/auth";
import { almatyToday, nextDays, toIsoDate } from "@/lib/dates";
import {
  AVAILABILITY_DAYS,
  AVAILABILITY_STATUSES,
  type AvailabilityStatus,
  PHOTOS_BUCKET,
} from "@/lib/places/constants";
import {
  type FieldError,
  type PlaceInput,
  type RawPlaceInput,
  validatePlaceInput,
} from "@/lib/places/validate";
import { uniqueSlug } from "@/lib/slug";
import { createAdminClient } from "@/lib/supabase/admin";

const PHOTO_PATH = /^places\/[0-9a-f-]{36}\.(jpg|png|webp)$/;
const PHOTO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

async function takenSlugs(exceptId?: string): Promise<Set<string>> {
  const supabase = createAdminClient();
  let query = supabase.from("places").select("slug");
  if (exceptId) query = query.neq("id", exceptId);
  const { data, error } = await query;
  if (error) throw error;
  return new Set(data.map((row) => row.slug));
}

/** Slug, введённый вручную, должен быть свободен; автоматический — делаем уникальным. */
function resolveSlug(
  data: PlaceInput,
  manual: boolean,
  taken: Set<string>,
): string | FieldError {
  if (!taken.has(data.slug)) return data.slug;
  if (manual)
    return { field: "slug", message: `Адрес (slug): «${data.slug}» уже занят` };
  return uniqueSlug(data.slug, taken);
}

// ── Сохранение объекта ────────────────────────────────────────────────────

export type SavePlaceState = { errors?: FieldError[] };

export async function savePlace(
  _prev: SavePlaceState,
  formData: FormData,
): Promise<SavePlaceState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "") || null;
  const raw: RawPlaceInput = {};
  for (const [key, value] of formData.entries())
    if (typeof value === "string") raw[key] = value;

  const result = validatePlaceInput(raw);
  if (!result.ok) return { errors: result.errors };
  const today = toIsoDate(almatyToday(new Date()));
  if (
    result.data.plan === "pro" &&
    result.data.pro_until &&
    result.data.pro_until < today
  )
    return {
      errors: [
        {
          field: "pro_until",
          message: "Pro до: дата уже прошла — продлите срок или выберите Free",
        },
      ],
    };

  let photos: string[];
  try {
    photos = JSON.parse(String(formData.get("photos") ?? "[]"));
  } catch {
    photos = [];
  }
  if (!Array.isArray(photos) || !photos.every((p) => PHOTO_PATH.test(p)))
    return {
      errors: [{ field: "photos", message: "Фото: неверный список файлов" }],
    };
  if (photos.length > PLAN_FEATURES.pro.photos)
    return {
      errors: [
        {
          field: "photos",
          message: `Фото: не больше ${PLAN_FEATURES.pro.photos} (на Free на сайте видны первые ${PLAN_FEATURES.free.photos})`,
        },
      ],
    };

  const slug = resolveSlug(
    result.data,
    Boolean(raw.slug?.trim()),
    await takenSlugs(id ?? undefined),
  );
  if (typeof slug !== "string") return { errors: [slug] };

  const row = { ...result.data, slug, photos };
  const supabase = createAdminClient();
  const { data, error } = id
    ? await supabase
        .from("places")
        .update(row)
        .eq("id", id)
        .select("id")
        .single()
    : await supabase.from("places").insert(row).select("id").single();

  if (error) {
    console.error("savePlace", error);
    return {
      errors: [{ field: "form", message: `Ошибка базы: ${error.message}` }],
    };
  }

  revalidatePath("/admin");
  redirect(`/admin/places/${data.id}?saved=1`);
}

// ── Фото: подписанная ссылка для загрузки прямо из браузера ──────────────
// Так файлы не идут через сервер Next.js (у Vercel лимит 4,5 МБ на запрос).

export async function createPhotoUpload(
  contentType: string,
): Promise<{ path: string; token: string } | { error: string }> {
  await requireAdmin();
  const ext = PHOTO_EXT[contentType];
  if (!ext) return { error: "Можно загружать только JPG, PNG или WebP" };

  const path = `places/${crypto.randomUUID()}.${ext}`;
  const { data, error } = await createAdminClient()
    .storage.from(PHOTOS_BUCKET)
    .createSignedUploadUrl(path);
  if (error) return { error: error.message };
  return { path: data.path, token: data.token };
}

// ── Занятость ─────────────────────────────────────────────────────────────

export async function setAvailability(
  placeId: string,
  date: string,
  status: AvailabilityStatus | null,
): Promise<{ error?: string; updatedAt?: string }> {
  await requireAdmin();

  if (!nextDays(new Date(), AVAILABILITY_DAYS).includes(date))
    return { error: "Дата вне диапазона 60 дней" };
  if (status !== null && !(status in AVAILABILITY_STATUSES))
    return { error: "Неизвестный статус" };

  const supabase = createAdminClient();
  if (status === null) {
    const { error } = await supabase
      .from("availability")
      .delete()
      .eq("place_id", placeId)
      .eq("date", date);
    return error ? { error: error.message } : {};
  }

  const { data, error } = await supabase
    .from("availability")
    .upsert({
      place_id: placeId,
      date,
      status,
      updated_at: new Date().toISOString(),
    })
    .select("updated_at")
    .single();
  return error ? { error: error.message } : { updatedAt: data.updated_at };
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

  const supabase = createAdminClient();
  const taken = await takenSlugs();
  const results: ImportRowResult[] = [];

  // По одной строке: ошибка в одной не ломает остальные.
  for (const { line, raw } of rows) {
    const name = raw.name_ru?.trim() || "(без названия)";
    const result = validatePlaceInput(raw);
    if (!result.ok) {
      results.push({
        line,
        name,
        ok: false,
        errors: result.errors.map((e) => e.message),
      });
      continue;
    }

    const slug = resolveSlug(result.data, Boolean(raw.slug?.trim()), taken);
    if (typeof slug !== "string") {
      results.push({ line, name, ok: false, errors: [slug.message] });
      continue;
    }

    const { data, error } = await supabase
      .from("places")
      .insert({ ...result.data, slug })
      .select("id")
      .single();

    if (error) {
      results.push({
        line,
        name,
        ok: false,
        errors: [`Ошибка базы: ${error.message}`],
      });
    } else {
      taken.add(slug);
      results.push({ line, name, ok: true, errors: [], id: data.id });
    }
  }

  revalidatePath("/admin");
  return results;
}
