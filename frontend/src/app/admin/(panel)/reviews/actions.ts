"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { adminApi } from "@/lib/api/client";

/** Модерация отзыва: published — на сайт, rejected — убрать или не показывать. */
export async function setReviewStatus(
  id: string,
  status: "published" | "rejected",
): Promise<{ error?: string }> {
  await requireAdmin();
  try {
    const result = await adminApi<{ error?: string }>(`/admin/reviews/${id}`, {
      method: "PATCH",
      body: { status },
    });
    revalidatePath("/admin/reviews");
    return result;
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Ошибка" };
  }
}
