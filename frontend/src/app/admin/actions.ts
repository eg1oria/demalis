"use server";

import { redirect } from "next/navigation";
import { isDevLoginAllowed } from "@/lib/admin/devLogin";
import { isAdminEmail } from "@/lib/admin/emails";
import { clearAdminSession, setAdminSession } from "@/lib/admin/session";
import { api, ApiError } from "@/lib/api/client";

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

/** Текст ошибки из ответа бэкенда ({ error: "…" }). */
function apiErrorText(e: unknown, fallback: string): string {
  if (
    e instanceof ApiError &&
    e.body &&
    typeof e.body === "object" &&
    "error" in e.body
  )
    return String(e.body.error);
  return fallback;
}

/** Письмо со ссылкой для входа (ссылка ведёт на /admin/auth/callback). */
export async function sendMagicLink(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const checked = adminEmailFrom(formData);
  if (!("email" in checked)) return checked;

  try {
    return await api<{ sentTo: string }>("/auth/magic-link", {
      method: "POST",
      body: { email: checked.email },
    });
  } catch (e) {
    console.error("sendMagicLink", e);
    return {
      error: apiErrorText(
        e,
        "Не удалось отправить письмо. Попробуйте ещё раз.",
      ),
    };
  }
}

/**
 * Вход без письма при локальной разработке: бэкенд сразу выдаёт токен.
 * Только для email из ADMIN_EMAILS и только когда isDevLoginAllowed().
 */
export async function devSignIn(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  if (!isDevLoginAllowed()) return { error: "Вход без письма отключён" };
  const checked = adminEmailFrom(formData);
  if (!("email" in checked)) return checked;

  let token: string;
  try {
    ({ token } = await api<{ token: string }>("/auth/dev-login", {
      method: "POST",
      body: { email: checked.email },
    }));
  } catch (e) {
    console.error("devSignIn", e);
    return {
      error: apiErrorText(
        e,
        "Не удалось войти. Запущен ли бэкенд (cd backend && npm run start:dev)?",
      ),
    };
  }
  await setAdminSession(token);
  redirect("/admin");
}

export async function signOut() {
  await clearAdminSession();
  redirect("/admin/login");
}
