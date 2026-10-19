"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { adminApi } from "@/lib/api/client";
import type { AvailabilityStatus } from "@/lib/places/constants";

export type SurveyResult = { error?: string; sent?: number; failed?: number };

/** Опрос владельцев в боте: статус и цена на праздничную ночь. */
export async function sendHolidaySurvey(night: string): Promise<SurveyResult> {
  await requireAdmin();
  try {
    const data = await adminApi<
      { error: string } | { result: { sent: number; failed: number } }
    >("/admin/holidays/survey", { method: "POST", body: { night } });
    return "error" in data ? { error: data.error } : data.result;
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Ошибка" };
  }
}

/** Админ отмечает ночь за владельца (например, после звонка). */
export async function setHolidayNight(
  placeId: string,
  night: string,
  status: AvailabilityStatus | null,
  price: number | null,
): Promise<{ error?: string }> {
  await requireAdmin();
  try {
    const data = await adminApi<{ error?: string }>(
      `/admin/holidays/${placeId}`,
      { method: "PUT", body: { night, status, price } },
    );
    if (data.error) return data;
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Ошибка" };
  }
  // Статусы и цены видны в каталоге, на главной и в подборках.
  revalidatePath("/", "layout");
  return {};
}
