"use server";

import { api, visitorHeaders } from "@/lib/api/client";
import { HONEYPOT_FIELD } from "@/lib/leads/constants";
import type { ReviewErrorCode, ReviewField } from "@/lib/reviews/validate";

export type ReviewFormState =
  | { status: "idle" }
  | {
      status: "error";
      errors?: Partial<Record<ReviewField, ReviewErrorCode>>;
      form?: "rateLimit" | "used" | "notFound" | "server";
    }
  | { status: "sent" };

const FIELDS = ["rating", "text", "name", "consent", HONEYPOT_FIELD];
const TOKEN = /^[\w-]{32}$/;

/** Отзыв гостя: проверка, лимит и уведомление админу — на бэкенде. */
export async function submitReview(
  token: string,
  _prev: ReviewFormState,
  formData: FormData,
): Promise<ReviewFormState> {
  if (!TOKEN.test(token)) return { status: "error", form: "notFound" };
  const body: Record<string, string> = {};
  for (const field of FIELDS) {
    const value = formData.get(field);
    if (typeof value === "string") body[field] = value;
  }
  try {
    return await api<ReviewFormState>(`/public/reviews/${token}`, {
      method: "POST",
      body,
      headers: await visitorHeaders(),
    });
  } catch (e) {
    console.error("submitReview", e);
    return { status: "error", form: "server" };
  }
}
