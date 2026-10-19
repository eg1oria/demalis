"use server";

import { api, visitorHeaders } from "@/lib/api/client";
import { HONEYPOT_FIELD } from "@/lib/leads/constants";
import type {
  OwnerRequestError,
  OwnerRequestField,
} from "@/lib/owners/request";

export type OwnerRequestState =
  | { status: "idle" }
  | {
      status: "error";
      errors?: Partial<Record<OwnerRequestField, OwnerRequestError>>;
      form?: "rateLimit" | "server";
    }
  | { status: "sent" };

const FIELDS: string[] = [
  "name",
  "phone",
  "instagram",
  "direction",
  "type",
  "consent",
  HONEYPOT_FIELD,
];

/**
 * Заявка владельца «Добавить объект»: бэкенд создаёт объект-черновик
 * и уведомляет админа в Telegram (Этап 7).
 */
export async function submitOwnerRequest(
  _prev: OwnerRequestState,
  formData: FormData,
): Promise<OwnerRequestState> {
  const body: Record<string, string> = {};
  for (const field of FIELDS) {
    const value = formData.get(field);
    if (typeof value === "string") body[field] = value;
  }
  try {
    return await api<OwnerRequestState>("/public/owner-requests", {
      method: "POST",
      body,
      headers: await visitorHeaders(),
    });
  } catch (e) {
    console.error("submitOwnerRequest", e);
    return { status: "error", form: "server" };
  }
}
