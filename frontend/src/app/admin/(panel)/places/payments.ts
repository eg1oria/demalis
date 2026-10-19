"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { adminApi } from "@/lib/api/client";

export type AddPaymentState = { error?: string; ok?: boolean };

/** Отметка «оплачено»: деньги приняты вручную (счёт в Kaspi). */
export async function addPayment(
  placeId: string,
  _prev: AddPaymentState,
  formData: FormData,
): Promise<AddPaymentState> {
  await requireAdmin();
  const get = (key: string) => String(formData.get(key) ?? "");
  const result = await adminApi<AddPaymentState>(
    `/admin/places/${placeId}/payments`,
    {
      method: "POST",
      body: {
        amount: get("amount"),
        kind: get("kind"),
        paid_at: get("paid_at"),
        comment: get("comment"),
      },
    },
  );
  if (result.error) return { error: result.error };
  revalidatePath(`/admin/places/${placeId}`);
  revalidatePath("/admin/billing");
  return { ok: true };
}

export async function deletePayment(
  paymentId: string,
  placeId: string,
): Promise<void> {
  await requireAdmin();
  await adminApi(`/admin/places/${placeId}/payments/${paymentId}`, {
    method: "DELETE",
  });
  revalidatePath(`/admin/places/${placeId}`);
  revalidatePath("/admin/billing");
}
