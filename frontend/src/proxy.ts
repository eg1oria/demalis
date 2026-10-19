import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intl = createMiddleware(routing);

export default function proxy(request: NextRequest) {
  // Админка не локализована; сессию проверяет бэкенд на каждой странице.
  if (request.nextUrl.pathname.startsWith("/admin")) return NextResponse.next();
  return intl(request);
}

export const config = {
  // Всё, кроме API, фото, служебных путей Next/Vercel и файлов с расширением.
  matcher: "/((?!api|uploads|_next|_vercel|.*\\..*).*)",
};
