import "server-only";
import { api, apiOrNull } from "@/lib/api/client";
import type { Enums, Tables } from "@/lib/api/types";

export type EventType = Enums<"event_type">;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Опубликованный объект по id — для маршрутов кликов (черновики бэкенд не отдаст). */
export async function getPublishedPlace(id: string) {
  if (!UUID.test(id)) return null;
  return apiOrNull<Tables<"places">>(`/public/places/${id}`);
}

/**
 * Записывает событие (без IP и персональных данных).
 * Ошибка записи не должна ломать переход посетителя — только лог.
 */
export async function recordEvent(placeId: string, type: EventType) {
  try {
    await api("/public/events", {
      method: "POST",
      body: { placeId, type },
    });
  } catch (e) {
    console.error("recordEvent", type, e);
  }
}
