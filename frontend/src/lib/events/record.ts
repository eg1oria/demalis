import "server-only";
import type { Enums } from "@/lib/supabase/database.types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPublicClient } from "@/lib/supabase/public";

export type EventType = Enums<"event_type">;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Опубликованный объект по id — для маршрутов кликов (черновики RLS не отдаст). */
export async function getPublishedPlace(id: string) {
  if (!UUID.test(id)) return null;
  const { data, error } = await createPublicClient()
    .from("places")
    .select("id, slug, name_ru, name_kk, whatsapp_phone, instagram_url")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * Записывает событие (без IP и персональных данных).
 * Ошибка записи не должна ломать переход посетителя — только лог.
 */
export async function recordEvent(placeId: string, type: EventType) {
  const { error } = await createAdminClient()
    .from("events")
    .insert({ place_id: placeId, type });
  if (error) console.error("recordEvent", type, error);
}
