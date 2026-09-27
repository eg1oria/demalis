"use server";

import { requireAdmin } from "@/lib/admin/auth";
import { LEAD_STATUSES, type LeadStatus } from "@/lib/leads/constants";
import { createAdminClient } from "@/lib/supabase/admin";

export async function setLeadStatus(
  id: string,
  status: LeadStatus,
): Promise<{ error?: string }> {
  await requireAdmin();
  if (!(status in LEAD_STATUSES)) return { error: "Неизвестный статус" };

  const { error } = await createAdminClient()
    .from("leads")
    .update({ status })
    .eq("id", id);
  return error ? { error: error.message } : {};
}
