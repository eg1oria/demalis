import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, api } from "@/lib/api/client";

export type AdminCheck =
  | { status: "admin"; email: string }
  | { status: "forbidden"; email: string }
  | { status: "anonymous" };

/** Кто вошёл: бэкенд проверяет токен из cookie и список ADMIN_EMAILS. */
export async function checkAdmin(): Promise<AdminCheck> {
  if (!(await cookies()).has(ADMIN_COOKIE)) return { status: "anonymous" };
  return api<AdminCheck>("/auth/me", { admin: true });
}

/** Для server actions: бросает ошибку, если вызывает не админ. */
export async function requireAdmin(): Promise<string> {
  const check = await checkAdmin();
  if (check.status === "anonymous") redirect("/admin/login");
  if (check.status !== "admin") throw new Error("Нет доступа");
  return check.email;
}

/** Для страниц админки: неавторизованных — на вход, не-админов — на отказ. */
export async function requireAdminPage(): Promise<string> {
  const check = await checkAdmin();
  if (check.status === "anonymous") redirect("/admin/login");
  if (check.status === "forbidden") redirect("/admin/denied");
  return check.email;
}
