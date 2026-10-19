import { NextResponse } from "next/server";
import { setAdminSession } from "@/lib/admin/session";
import { api } from "@/lib/api/client";

/** Сюда ведёт ссылка из письма: меняем одноразовый токен на сессию и пускаем в админку. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (token) {
    try {
      const session = await api<{ token: string }>("/auth/verify", {
        method: "POST",
        body: { token },
      });
      await setAdminSession(session.token);
      return NextResponse.redirect(new URL("/admin", url.origin));
    } catch (e) {
      console.error("auth callback", e);
    }
  }
  return NextResponse.redirect(new URL("/admin/login?error=link", url.origin));
}
