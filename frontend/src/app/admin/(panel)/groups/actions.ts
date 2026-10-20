"use server";

import { requireAdmin } from "@/lib/admin/auth";
import { adminApi } from "@/lib/api/client";
import { GROUP_STATUSES, type GroupStatus } from "@/lib/groups/validate";

async function updateGroupRequest(
  id: string,
  body: { status?: GroupStatus; admin_note?: string },
): Promise<{ error?: string }> {
  await requireAdmin();
  try {
    return await adminApi<{ error?: string }>(`/admin/group-requests/${id}`, {
      method: "PATCH",
      body,
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Ошибка" };
  }
}

export async function setGroupStatus(
  id: string,
  status: GroupStatus,
): Promise<{ error?: string }> {
  if (!Object.hasOwn(GROUP_STATUSES, status))
    return { error: "Неизвестный статус" };
  return updateGroupRequest(id, { status });
}

/** Заметка админа: какие варианты отправили, что ответили. */
export async function setGroupNote(
  id: string,
  note: string,
): Promise<{ error?: string }> {
  return updateGroupRequest(id, { admin_note: note });
}
