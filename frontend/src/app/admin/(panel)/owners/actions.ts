"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { adminApi } from "@/lib/api/client";
import { parseMonth } from "@/lib/dates";

export type SaveOwnerState = { error?: string };

export async function saveOwner(
  _prev: SaveOwnerState,
  formData: FormData,
): Promise<SaveOwnerState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "") || null;
  const body = {
    name: String(formData.get("name") ?? ""),
    phone: String(formData.get("phone") ?? ""),
  };
  // Имя и телефон проверяет бэкенд.
  const result = await adminApi<{ id: string } | { error: string }>(
    id ? `/admin/owners/${id}` : "/admin/owners",
    { method: id ? "PATCH" : "POST", body },
  );
  if ("error" in result) return { error: result.error };

  revalidatePath("/admin/owners");
  redirect(`/admin/owners/${result.id}?saved=1`);
}

/** Новый одноразовый код привязки бота (старый перестаёт работать). */
export async function createLinkCode(ownerId: string): Promise<void> {
  await requireAdmin();
  await adminApi(`/admin/owners/${ownerId}/link-code`, { method: "POST" });
  revalidatePath("/admin/owners");
  redirect(`/admin/owners/${ownerId}`);
}

export async function unlinkTelegram(ownerId: string): Promise<void> {
  await requireAdmin();
  await adminApi(`/admin/owners/${ownerId}/telegram`, { method: "DELETE" });
  revalidatePath("/admin/owners");
  redirect(`/admin/owners/${ownerId}`);
}

/** Отправить владельцу отчёт за месяц вручную (Этап 9: проверка перед рассылкой). */
export async function sendReportNow(
  ownerId: string,
  formData: FormData,
): Promise<void> {
  await requireAdmin();
  const month = parseMonth(formData.get("month"), new Date());
  const { result } = await adminApi<{ result: string }>(
    `/admin/owners/${ownerId}/report`,
    { method: "POST", body: { month } },
  );
  redirect(`/admin/owners/${ownerId}?month=${month}&report=${result}`);
}
