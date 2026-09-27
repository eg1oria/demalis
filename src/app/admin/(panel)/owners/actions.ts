"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { generateLinkCode } from "@/lib/bot/linkCode";
import { normalizeKzPhone } from "@/lib/phone";
import { createAdminClient } from "@/lib/supabase/admin";

export type SaveOwnerState = { error?: string };

export async function saveOwner(
  _prev: SaveOwnerState,
  formData: FormData,
): Promise<SaveOwnerState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "") || null;
  const name = String(formData.get("name") ?? "")
    .trim()
    .replace(/\s+/g, " ");
  const rawPhone = String(formData.get("phone") ?? "").trim();

  if (!name) return { error: "Укажите имя владельца" };
  if (name.length > 100) return { error: "Имя длиннее 100 символов" };
  const phone = rawPhone ? normalizeKzPhone(rawPhone) : null;
  if (rawPhone && !phone)
    return {
      error: "Телефон: нужен казахстанский номер, например +7 701 123 45 67",
    };

  const supabase = createAdminClient();
  const row = { name, phone };
  const { data, error } = id
    ? await supabase
        .from("owners")
        .update(row)
        .eq("id", id)
        .select("id")
        .single()
    : await supabase.from("owners").insert(row).select("id").single();
  if (error) return { error: `Ошибка базы: ${error.message}` };

  revalidatePath("/admin/owners");
  redirect(`/admin/owners/${data.id}?saved=1`);
}

/** Новый одноразовый код привязки бота (старый перестаёт работать). */
export async function createLinkCode(ownerId: string): Promise<void> {
  await requireAdmin();
  const supabase = createAdminClient();
  // Совпадение кодов почти невозможно, но на всякий случай — пара попыток.
  for (let attempt = 0; attempt < 3; attempt++) {
    const { error } = await supabase
      .from("owners")
      .update({ link_code: generateLinkCode() })
      .eq("id", ownerId);
    if (!error) break;
    if (error.code !== "23505") throw error;
  }
  revalidatePath("/admin/owners");
  redirect(`/admin/owners/${ownerId}`);
}

export async function unlinkTelegram(ownerId: string): Promise<void> {
  await requireAdmin();
  const { error } = await createAdminClient()
    .from("owners")
    .update({ telegram_chat_id: null, link_code: null })
    .eq("id", ownerId);
  if (error) throw error;
  revalidatePath("/admin/owners");
  redirect(`/admin/owners/${ownerId}`);
}
