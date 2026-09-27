"use server";

import { headers } from "next/headers";
import { after } from "next/server";
import { HONEYPOT_FIELD, LEAD_RATE_LIMIT } from "@/lib/leads/constants";
import { ownerRequestTelegramMessage } from "@/lib/owners/message";
import {
  type OwnerRequestError,
  type OwnerRequestField,
  validateOwnerRequest,
} from "@/lib/owners/request";
import { clientIp, rateLimitKey } from "@/lib/request";
import { slugify, uniqueSlug } from "@/lib/slug";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTelegramMessage } from "@/lib/telegram/send";

export type OwnerRequestState =
  | { status: "idle" }
  | {
      status: "error";
      errors?: Partial<Record<OwnerRequestField, OwnerRequestError>>;
      form?: "rateLimit" | "server";
    }
  | { status: "sent" };

const FIELDS: OwnerRequestField[] = [
  "name",
  "phone",
  "instagram",
  "direction",
  "type",
  "consent",
];

/** Свободный slug: занятые с тем же началом + «-2», «-3»… */
async function freeSlug(
  supabase: ReturnType<typeof createAdminClient>,
  name: string,
): Promise<string> {
  const base = slugify(name) || "place";
  const { data, error } = await supabase
    .from("places")
    .select("slug")
    .like("slug", `${base}%`);
  if (error) throw error;
  return uniqueSlug(base, new Set(data.map((r) => r.slug)));
}

/**
 * Заявка владельца «Добавить объект»: создаёт объект-черновик
 * и уведомляет админа в Telegram (Этап 7).
 */
export async function submitOwnerRequest(
  _prev: OwnerRequestState,
  formData: FormData,
): Promise<OwnerRequestState> {
  // Ловушка заполнена — бот. Делаем вид, что всё хорошо.
  if (String(formData.get(HONEYPOT_FIELD) ?? "").trim())
    return { status: "sent" };

  const raw: Partial<Record<OwnerRequestField, string>> = {};
  for (const field of FIELDS) {
    const value = formData.get(field);
    if (typeof value === "string") raw[field] = value;
  }
  const result = validateOwnerRequest(raw);
  if (!result.ok) return { status: "error", errors: result.errors };
  const request = result.data;

  const supabase = createAdminClient();
  const { data: allowed, error: limitError } = await supabase.rpc(
    "hit_lead_rate_limit",
    {
      p_key: rateLimitKey(
        clientIp(await headers()),
        process.env.SUPABASE_SECRET_KEY!,
        "owner",
      ),
      p_limit: LEAD_RATE_LIMIT.max,
      p_window: LEAD_RATE_LIMIT.window,
    },
  );
  if (limitError) {
    console.error("submitOwnerRequest rate limit", limitError);
    return { status: "error", form: "server" };
  }
  if (!allowed) return { status: "error", form: "rateLimit" };

  const row = {
    name_ru: request.name,
    type: request.type,
    direction: request.direction,
    whatsapp_phone: request.phone,
    instagram_url: request.instagram_url,
    photos_permission: true,
    status: "draft" as const,
  };
  // Две заявки с одинаковым названием одновременно — повторяем с новым slug.
  let placeId: string | null = null;
  for (let attempt = 0; attempt < 3 && !placeId; attempt++) {
    const slug = await freeSlug(supabase, request.name);
    const { data, error } = await supabase
      .from("places")
      .insert({ ...row, slug })
      .select("id")
      .single();
    if (data) placeId = data.id;
    else if (error.code !== "23505") {
      console.error("submitOwnerRequest insert", error);
      return { status: "error", form: "server" };
    }
  }
  if (!placeId) return { status: "error", form: "server" };

  after(async () => {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
    try {
      await sendTelegramMessage(
        process.env.ADMIN_TELEGRAM_CHAT_ID,
        ownerRequestTelegramMessage(
          request,
          siteUrl ? `${siteUrl}/admin/places/${placeId}` : null,
        ),
      );
    } catch (e) {
      console.error("submitOwnerRequest telegram", e);
    }
  });

  return { status: "sent" };
}
