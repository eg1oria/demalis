"use server";

import { requireAdmin } from "@/lib/admin/auth";
import { adminApi } from "@/lib/api/client";
import { LEAD_STATUSES, type LeadStatus } from "@/lib/leads/constants";
import { absoluteUrl } from "@/lib/seo";

async function updateLead(
  id: string,
  body: { status?: LeadStatus; billable?: boolean },
): Promise<{ error?: string }> {
  await requireAdmin();
  try {
    return await adminApi<{ error?: string }>(`/admin/leads/${id}`, {
      method: "PATCH",
      body,
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Ошибка" };
  }
}

export async function setLeadStatus(
  id: string,
  status: LeadStatus,
): Promise<{ error?: string }> {
  if (!(status in LEAD_STATUSES)) return { error: "Неизвестный статус" };
  return updateLead(id, { status });
}

/** Платная заявка (Этап 8): считается в отчёте «Оплаты» за месяц. */
export async function setLeadBillable(
  id: string,
  billable: boolean,
): Promise<{ error?: string }> {
  return updateLead(id, { billable });
}

/**
 * Ссылка на отзыв для гостя: бэкенд выдаёт одноразовый токен,
 * админ отправляет ссылку в WhatsApp. Повторный вызов — новая ссылка.
 */
export async function createReviewInvite(
  id: string,
): Promise<{ url?: string; error?: string }> {
  await requireAdmin();
  try {
    const result = await adminApi<{ token?: string; error?: string }>(
      `/admin/leads/${id}/review-invite`,
      { method: "POST" },
    );
    if (!result.token) return { error: result.error ?? "Ошибка" };
    return { url: absoluteUrl(`/ru/review/${result.token}`) };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Ошибка" };
  }
}
