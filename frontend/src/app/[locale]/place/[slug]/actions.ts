"use server";

import { api, visitorHeaders } from "@/lib/api/client";
import { HONEYPOT_FIELD } from "@/lib/leads/constants";
import type { LeadErrorCode, LeadField } from "@/lib/leads/validate";

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

const FIELDS: string[] = [
  "placeId",
  "name",
  "phone",
  "dateFrom",
  "dateTo",
  "guests",
  "comment",
  "consent",
  HONEYPOT_FIELD,
];

/**
 * Заявка гостя. Проверку, лимит с одного IP, сохранение и уведомления
 * в Telegram делает бэкенд (POST /public/leads).
 */
export async function submitLead(
  _prev: LeadFormState,
  formData: FormData,
): Promise<LeadFormState> {
  const body: Record<string, string> = {};
  for (const field of FIELDS) {
    const value = formData.get(field);
    if (typeof value === "string") body[field] = value;
  }
  try {
    return await api<LeadFormState>("/public/leads", {
      method: "POST",
      body,
      headers: await visitorHeaders(),
    });
  } catch (e) {
    console.error("submitLead", e);
    return { status: "error", form: "server" };
  }
}
