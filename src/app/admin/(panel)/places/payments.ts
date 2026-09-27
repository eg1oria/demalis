"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { validatePayment } from "@/lib/payments/validate";
import { createAdminClient } from "@/lib/supabase/admin";

export type AddPaymentState = { error?: string; ok?: boolean };

/** Отметка «оплачено»: деньги приняты вручную (счёт в Kaspi). */
export async function addPayment(
  placeId: string,
  _prev: AddPaymentState,
  formData: FormData,
): Promise<AddPaymentState> {
  await requireAdmin();
  const get = (key: string) => String(formData.get(key) ?? "");
  const result = validatePayment({
    amount: get("amount"),
    kind: get("kind"),
    paid_at: get("paid_at"),
    comment: get("comment"),
  });
  if (!result.ok) return { error: result.error };

  const { error } = await createAdminClient()
    .from("payments")
    .insert({ ...result.data, place_id: placeId });
  if (error) return { error: `Ошибка базы: ${error.message}` };
  revalidatePath(`/admin/places/${placeId}`);
  revalidatePath("/admin/billing");
  return { ok: true };
}

export async function deletePayment(
  paymentId: string,
  placeId: string,
): Promise<void> {
  await requireAdmin();
  const { error } = await createAdminClient()
    .from("payments")
    .delete()
    .eq("id", paymentId)
    .eq("place_id", placeId);
  if (error) throw error;
  revalidatePath(`/admin/places/${placeId}`);
  revalidatePath("/admin/billing");
}
