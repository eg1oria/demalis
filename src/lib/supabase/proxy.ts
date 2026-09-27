import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./env";

/** Обновляет сессию Supabase в cookie (вызывается из src/proxy.ts для /admin). */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) return response;

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        for (const { name, value } of cookiesToSet)
          request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet)
          response.cookies.set(name, value, options);
      },
    },
  });

  // Не удалять: именно этот вызов обновляет просроченный токен.
  await supabase.auth.getUser();
  return response;
}
