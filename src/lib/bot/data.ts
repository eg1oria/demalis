import "server-only";
import type { IsoDate } from "@/lib/dates";
import type { LeadStatus } from "@/lib/leads/constants";
import type { AvailabilityStatus } from "@/lib/places/constants";
import { createAdminClient } from "@/lib/supabase/admin";
import type { DraftStatus } from "./callbacks";
import { type BotLang, isBotLang } from "./texts";

/** Владелец, привязанный к чату бота. language: null — ещё не выбран. */
export type BotOwner = { id: string; name: string; language: BotLang | null };

export type BotPlace = { id: string; name_ru: string; name_kk: string | null };

const db = () => createAdminClient();

function toOwner(row: {
  id: string;
  name: string;
  language: string | null;
}): BotOwner {
  return {
    id: row.id,
    name: row.name,
    language: isBotLang(row.language) ? row.language : null,
  };
}

export async function getOwnerByChat(chatId: number): Promise<BotOwner | null> {
  const { data, error } = await db()
    .from("owners")
    .select("id, name, language")
    .eq("telegram_chat_id", chatId)
    .maybeSingle();
  if (error) throw error;
  return data && toOwner(data);
}

/**
 * Привязка по одноразовому коду. Код сразу становится недействительным.
 * Если этот чат был привязан к другому владельцу — отвязываем его.
 */
export async function linkOwnerByCode(
  code: string,
  chatId: number,
): Promise<BotOwner | null> {
  const supabase = db();
  const { data: owner, error } = await supabase
    .from("owners")
    .select("id")
    .eq("link_code", code)
    .maybeSingle();
  if (error) throw error;
  if (!owner) return null;

  const unlink = await supabase
    .from("owners")
    .update({ telegram_chat_id: null })
    .eq("telegram_chat_id", chatId)
    .neq("id", owner.id);
  if (unlink.error) throw unlink.error;

  // Условие на link_code: если код успели использовать параллельно — строк не будет.
  const { data, error: linkError } = await supabase
    .from("owners")
    .update({ telegram_chat_id: chatId, link_code: null })
    .eq("id", owner.id)
    .eq("link_code", code)
    .select("id, name, language")
    .maybeSingle();
  if (linkError) throw linkError;
  return data && toOwner(data);
}

export async function setOwnerLanguage(ownerId: string, lang: BotLang) {
  const { error } = await db()
    .from("owners")
    .update({ language: lang })
    .eq("id", ownerId);
  if (error) throw error;
}

export async function ownerPlaces(ownerId: string): Promise<BotPlace[]> {
  const { data, error } = await db()
    .from("places")
    .select("id, name_ru, name_kk")
    .eq("owner_id", ownerId)
    .neq("status", "hidden")
    .order("name_ru");
  if (error) throw error;
  return data;
}

/** Объект, только если он принадлежит этому владельцу. */
export async function ownerPlace(
  ownerId: string,
  placeId: string,
): Promise<BotPlace | null> {
  const { data, error } = await db()
    .from("places")
    .select("id, name_ru, name_kk")
    .eq("id", placeId)
    .eq("owner_id", ownerId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function placeStatuses(
  placeId: string,
  dates: IsoDate[],
): Promise<DraftStatus[]> {
  const { data, error } = await db()
    .from("availability")
    .select("date, status")
    .eq("place_id", placeId)
    .in("date", dates);
  if (error) throw error;
  const byDate = new Map(data.map((r) => [r.date, r.status]));
  return dates.map((d) => byDate.get(d) ?? null);
}

/** Сохраняет отмеченные дни (неотмеченные не трогаем). */
export async function saveStatuses(
  placeIds: string[],
  days: { date: IsoDate; status: AvailabilityStatus }[],
) {
  if (placeIds.length === 0 || days.length === 0) return;
  const updatedAt = new Date().toISOString();
  const rows = placeIds.flatMap((placeId) =>
    days.map(({ date, status }) => ({
      place_id: placeId,
      date,
      status,
      updated_at: updatedAt,
    })),
  );
  const { error } = await db().from("availability").upsert(rows);
  if (error) throw error;
}

export type OwnerLead = {
  id: string;
  name: string;
  phone: string;
  date_from: string | null;
  date_to: string | null;
  guests: number | null;
  comment: string | null;
  status: LeadStatus;
  created_at: string;
  place: BotPlace;
};

const LEAD_FIELDS =
  "id, name, phone, date_from, date_to, guests, comment, status, created_at, place:places!inner (id, name_ru, name_kk, owner_id)" as const;

export async function recentLeads(
  ownerId: string,
  limit = 10,
): Promise<OwnerLead[]> {
  const { data, error } = await db()
    .from("leads")
    .select(LEAD_FIELDS)
    .eq("place.owner_id", ownerId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

/** Заявка, только если объект принадлежит этому владельцу. */
export async function ownerLead(
  ownerId: string,
  leadId: string,
): Promise<OwnerLead | null> {
  const { data, error } = await db()
    .from("leads")
    .select(LEAD_FIELDS)
    .eq("id", leadId)
    .eq("place.owner_id", ownerId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function setLeadStatus(leadId: string, status: LeadStatus) {
  const { error } = await db()
    .from("leads")
    .update({ status })
    .eq("id", leadId);
  if (error) throw error;
}

export async function ownerStats(ownerId: string) {
  const [places, stats] = await Promise.all([
    ownerPlaces(ownerId),
    db().rpc("place_stats"),
  ]);
  if (stats.error) throw stats.error;
  const byId = new Map(stats.data.map((s) => [s.place_id, s]));
  return places.map((place) => {
    const s = byId.get(place.id);
    return {
      place,
      views: s?.views_7 ?? 0,
      clicks: s?.whatsapp_7 ?? 0,
      leads: s?.leads_7 ?? 0,
    };
  });
}

/** Владельцы с ботом и хотя бы одним объектом — для напоминания. */
export async function ownersToRemind(): Promise<
  { chatId: number; language: BotLang | null }[]
> {
  const { data, error } = await db()
    .from("owners")
    .select("telegram_chat_id, language, places!inner (id)")
    .not("telegram_chat_id", "is", null)
    .neq("places.status", "hidden");
  if (error) throw error;
  return data.map((o) => ({
    chatId: o.telegram_chat_id!,
    language: isBotLang(o.language) ? o.language : null,
  }));
}

/** Куда отправить заявку: чат и язык владельца объекта. */
export async function placeOwnerChat(
  placeId: string,
): Promise<{ chatId: number; language: BotLang | null } | null> {
  const { data, error } = await db()
    .from("places")
    .select("owner:owners!inner (telegram_chat_id, language)")
    .eq("id", placeId)
    .maybeSingle();
  if (error) throw error;
  const chatId = data?.owner.telegram_chat_id;
  if (!chatId) return null;
  return {
    chatId,
    language: isBotLang(data.owner.language) ? data.owner.language : null,
  };
}
