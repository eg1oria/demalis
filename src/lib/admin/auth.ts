import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "./emails";

export type AdminCheck =
  | { status: "admin"; email: string }
  | { status: "forbidden"; email: string }
  | { status: "anonymous" };

export async function checkAdmin(): Promise<AdminCheck> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return { status: "anonymous" };
  return isAdminEmail(user.email)
    ? { status: "admin", email: user.email }
    : { status: "forbidden", email: user.email };
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
