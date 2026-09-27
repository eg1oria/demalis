"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isAdminEmail } from "@/lib/admin/emails";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { error?: string; sentTo?: string };

export async function sendMagicLink(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return { error: "Введите корректный email" };
  if (!isAdminEmail(email))
    return { error: "У этого email нет доступа к админке" };

  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/admin/auth/callback` },
  });

  if (error) {
    console.error("signInWithOtp", error);
    return {
      error:
        error.status === 429
          ? "Слишком много писем подряд. Подождите минуту и попробуйте снова."
          : "Не удалось отправить письмо. Попробуйте ещё раз.",
    };
  }
  return { sentTo: email };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
