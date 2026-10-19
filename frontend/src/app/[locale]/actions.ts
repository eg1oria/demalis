"use server";

import { api, visitorHeaders } from "@/lib/api/client";
import type { GroupErrorCode, GroupField } from "@/lib/groups/validate";
import { HONEYPOT_FIELD } from "@/lib/leads/constants";

export type GroupRequestState =
  | { status: "idle" }
  | {
      status: "error";
      errors?: Partial<Record<GroupField, GroupErrorCode>>;
      form?: "rateLimit" | "server";
    }
  | { status: "sent" };

const FIELDS: string[] = [
  "name",
  "phone",
  "occasion",
  "guests",
  "dateFrom",
  "dateTo",
  "budget",
  "direction",
  "comment",
  "consent",
  HONEYPOT_FIELD,
];

/**
 * «Подберём за вас» (главная): бэкенд проверяет заявку, сохраняет
 * и уведомляет админа в Telegram (POST /public/group-requests).
 */
export async function submitGroupRequest(
  _prev: GroupRequestState,
  formData: FormData,
): Promise<GroupRequestState> {
  const body: Record<string, string> = {};
  for (const field of FIELDS) {
    const value = formData.get(field);
    if (typeof value === "string") body[field] = value;
  }
  // Пожелания — несколько чекбоксов с одним именем.
  body.amenities = formData
    .getAll("amenities")
    .filter((v) => typeof v === "string")
    .join(",");
  try {
    return await api<GroupRequestState>("/public/group-requests", {
      method: "POST",
      body,
      headers: await visitorHeaders(),
    });
  } catch (e) {
    console.error("submitGroupRequest", e);
    return { status: "error", form: "server" };
  }
}
