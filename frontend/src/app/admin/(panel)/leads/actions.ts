"use server";

import { requireAdmin } from "@/lib/admin/auth";
import { adminApi } from "@/lib/api/client";
import { LEAD_STATUSES, type LeadStatus } from "@/lib/leads/constants";

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
