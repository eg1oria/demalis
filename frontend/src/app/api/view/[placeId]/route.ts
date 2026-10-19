import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getPublishedPlace, recordEvent } from "@/lib/events/record";
import { isBot } from "@/lib/request";

/** Один просмотр с браузера не чаще раза в 30 минут (Этап 4 ТЗ). */
const VIEW_COOLDOWN_SECONDS = 30 * 60;
const COOKIE = "viewed";

/**
 * Запись просмотра страницы объекта. Вызывается из браузера после загрузки
 * страницы. Cookie живёт 30 минут и уходит только на этот адрес (path),
 * так что не утяжеляет остальные запросы.
 */
export async function POST(
  request: Request,
  ctx: RouteContext<"/api/view/[placeId]">,
) {
  const { placeId } = await ctx.params;
  const headers = { "Cache-Control": "no-store" };
  const cookieStore = await cookies();
  if (cookieStore.has(COOKIE) || isBot(request.headers.get("user-agent")))
    return new NextResponse(null, { status: 204, headers });

  const place = await getPublishedPlace(placeId);
  if (!place) return new NextResponse(null, { status: 404, headers });

  await recordEvent(place.id, "view");
  cookieStore.set(COOKIE, "1", {
    path: `/api/view/${place.id}`,
    maxAge: VIEW_COOLDOWN_SECONDS,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return new NextResponse(null, { status: 204, headers });
}
