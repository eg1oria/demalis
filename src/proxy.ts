import type { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { updateSession } from "./lib/supabase/proxy";

const intl = createMiddleware(routing);

export default function proxy(request: NextRequest) {
  // Админка не локализована — только обновляем сессию Supabase.
  if (request.nextUrl.pathname.startsWith("/admin")) {
    return updateSession(request);
  }
  return intl(request);
}

export const config = {
  // Всё, кроме API, служебных путей Next/Vercel и файлов с расширением.
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
