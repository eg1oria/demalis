"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isDevLoginAllowed } from "@/lib/admin/devLogin";
import { isAdminEmail } from "@/lib/admin/emails";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { error?: string; sentTo?: string };

/** Email из формы входа или текст ошибки. */
function adminEmailFrom(formData: FormData): { email: string } | LoginState {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return { error: "Введите корректный email" };
  if (!isAdminEmail(email))
    return { error: "У этого email нет доступа к админке" };
  return { email };
}

export async function sendMagicLink(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const checked = adminEmailFrom(formData);
  if (!("email" in checked)) return checked;
  const { email } = checked;

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

/**
 * Вход без письма при локальной разработке: сервер сам выпускает одноразовую
 * ссылку (как в письме) и сразу обменивает её на сессию. Только для email
 * из ADMIN_EMAILS и только когда isDevLoginAllowed().
 */
export async function devSignIn(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  if (!isDevLoginAllowed()) return { error: "Вход без письма отключён" };
  const checked = adminEmailFrom(formData);
  if (!("email" in checked)) return checked;
  const { email } = checked;

  const admin = createAdminClient();
  let link = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (link.error) {
    // Первый вход: пользователя в локальной базе ещё нет — создаём.
    const created = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
    });
    if (created.error) {
      console.error("devSignIn createUser", created.error);
      return {
        error: "Не удалось войти. Запущен ли Supabase (npm run db:start)?",
      };
    }
    link = await admin.auth.admin.generateLink({ type: "magiclink", email });
  }
  if (link.error) {
    console.error("devSignIn generateLink", link.error);
    return {
      error: "Не удалось войти. Запущен ли Supabase (npm run db:start)?",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    type: "email",
    token_hash: link.data.properties.hashed_token,
  });
  if (error) {
    console.error("devSignIn verifyOtp", error);
    return { error: "Не удалось войти. Попробуйте ещё раз." };
  }
  redirect("/admin");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
