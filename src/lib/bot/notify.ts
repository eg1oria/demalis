import "server-only";
import { createBotApi } from "@/lib/telegram/api";
import type { LeadInput } from "@/lib/leads/validate";
import { createAdminClient } from "@/lib/supabase/admin";
import { ownersToRemind, placeOwnerChat } from "./data";
import { leadKeyboard, remindKeyboard } from "./keyboards";
import { ownerLeadMessage } from "./messages";
import { BOT_TEXTS } from "./texts";

/**
 * Новая заявка — владельцу в бот с кнопками «Связался ✅» / «Не дозвонился».
 * Статус заявки → «отправлена владельцу». Нет бота у владельца — пропуск.
 */
export async function notifyOwnerAboutLead(
  lead: LeadInput & { id: string },
  place: { id: string; name_ru: string; name_kk: string | null },
): Promise<boolean> {
  const api = createBotApi();
  if (!api) return false;
  const owner = await placeOwnerChat(place.id);
  if (!owner) return false;

  const lang = owner.language ?? "ru";
  await api.sendMessage(
    owner.chatId,
    ownerLeadMessage({ ...lead, status: "sent_to_owner" }, place, lang),
    { reply_markup: leadKeyboard(lead.id, lang) },
  );
  // Только если админ ещё не успел поменять статус вручную.
  const { error } = await createAdminClient()
    .from("leads")
    .update({ status: "sent_to_owner" })
    .eq("id", lead.id)
    .eq("status", "new");
  if (error) throw error;
  return true;
}

/** Напоминание «Обновите занятость на выходные» всем владельцам с ботом. */
export async function sendWeeklyReminders(): Promise<{
  sent: number;
  failed: number;
}> {
  const api = createBotApi();
  if (!api) throw new Error("Не задан TELEGRAM_BOT_TOKEN");
  let sent = 0;
  let failed = 0;
  for (const { chatId, language } of await ownersToRemind()) {
    const lang = language ?? "ru";
    try {
      await api.sendMessage(chatId, BOT_TEXTS[lang].reminder, {
        reply_markup: remindKeyboard(lang),
      });
      sent++;
    } catch (e) {
      // Например, владелец заблокировал бота — остальным всё равно отправляем.
      console.error("reminder", chatId, e);
      failed++;
    }
  }
  return { sent, failed };
}
