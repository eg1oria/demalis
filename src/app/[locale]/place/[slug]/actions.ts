"use server";

import { headers } from "next/headers";
import { after } from "next/server";
import { almatyToday, toIsoDate } from "@/lib/dates";
import { notifyOwnerAboutLead } from "@/lib/bot/notify";
import { getPublishedPlace } from "@/lib/events/record";
import { HONEYPOT_FIELD, LEAD_RATE_LIMIT } from "@/lib/leads/constants";
import { leadTelegramMessage } from "@/lib/leads/message";
import {
  type LeadErrorCode,
  type LeadField,
  type RawLeadInput,
  validateLead,
} from "@/lib/leads/validate";
import { clientIp, rateLimitKey } from "@/lib/request";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTelegramMessage } from "@/lib/telegram/send";

export type LeadFormState =
  | { status: "idle" }
  | {
      status: "error";
      /** Ошибки по полям (коды, текст — в messages). */
      errors?: Partial<Record<LeadField, LeadErrorCode>>;
      /** Ошибка всей формы. */
      form?: "rateLimit" | "unavailable" | "server";
    }
  | {
      status: "sent";
      dates: { checkIn: string; checkOut: string } | null;
      guests: number | null;
    };

const FIELDS: LeadField[] = [
  "name",
  "phone",
  "dateFrom",
  "dateTo",
  "guests",
  "comment",
];

export async function submitLead(
  _prev: LeadFormState,
  formData: FormData,
): Promise<LeadFormState> {
  const raw: RawLeadInput = {};
  for (const field of FIELDS) {
    const value = formData.get(field);
    if (typeof value === "string") raw[field] = value;
  }

  // Ловушка заполнена — это бот. Делаем вид, что всё хорошо, и ничего не сохраняем.
  if (String(formData.get(HONEYPOT_FIELD) ?? "").trim())
    return { status: "sent", dates: null, guests: null };

  const place = await getPublishedPlace(String(formData.get("placeId") ?? ""));
  if (!place) return { status: "error", form: "unavailable" };

  const result = validateLead(raw, toIsoDate(almatyToday(new Date())));
  if (!result.ok) return { status: "error", errors: result.errors };
  const lead = result.data;

  const supabase = createAdminClient();
  // Лимит считаем только по прошедшим проверку заявкам: ошибка в телефоне не «съедает» попытку.
  const { data: allowed, error: limitError } = await supabase.rpc(
    "hit_lead_rate_limit",
    {
      p_key: rateLimitKey(
        clientIp(await headers()),
        process.env.SUPABASE_SECRET_KEY!,
      ),
      p_limit: LEAD_RATE_LIMIT.max,
      p_window: LEAD_RATE_LIMIT.window,
    },
  );
  if (limitError) {
    console.error("submitLead rate limit", limitError);
    return { status: "error", form: "server" };
  }
  if (!allowed) return { status: "error", form: "rateLimit" };

  const { data: saved, error } = await supabase
    .from("leads")
    .insert({ ...lead, place_id: place.id })
    .select("id")
    .single();
  if (error) {
    console.error("submitLead insert", error);
    return { status: "error", form: "server" };
  }

  // Уведомления — после ответа посетителю, чтобы не ждать Telegram.
  after(async () => {
    try {
      await notifyOwnerAboutLead({ ...lead, id: saved.id }, place);
    } catch (e) {
      console.error("submitLead owner bot", e);
    }
  });
  after(async () => {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
    try {
      await sendTelegramMessage(
        process.env.ADMIN_TELEGRAM_CHAT_ID,
        leadTelegramMessage(
          lead,
          place.name_ru,
          siteUrl ? `${siteUrl}/admin/leads` : null,
        ),
      );
    } catch (e) {
      console.error("submitLead telegram", e);
    }
  });

  return {
    status: "sent",
    dates: { checkIn: lead.date_from, checkOut: lead.date_to },
    guests: lead.guests,
  };
}
