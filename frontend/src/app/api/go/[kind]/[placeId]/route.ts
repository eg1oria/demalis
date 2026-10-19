import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { SITE_NAME } from "@/config/site";
import {
  type EventType,
  getPublishedPlace,
  recordEvent,
} from "@/lib/events/record";
import { GO_KINDS, type GoKind, parseGoParams } from "@/lib/go";
import { placeName, whatsappUrl } from "@/lib/places/present";
import { isBot } from "@/lib/request";
import { formatStay } from "@/lib/when";

const EVENT: Record<GoKind, EventType> = {
  whatsapp: "whatsapp_click",
  phone: "phone_click",
  instagram: "instagram_click",
};

const NO_STORE = {
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex, nofollow",
};

type Context = RouteContext<"/api/go/[kind]/[placeId]">;

async function resolve(ctx: Context) {
  const { kind, placeId } = await ctx.params;
  if (!GO_KINDS.includes(kind as GoKind)) return null;
  const place = await getPublishedPlace(placeId);
  return place ? { kind: kind as GoKind, place } : null;
}

async function track(request: Request, kind: GoKind, placeId: string) {
  if (!isBot(request.headers.get("user-agent")))
    await recordEvent(placeId, EVENT[kind]);
}

/** Переход: записать клик и перенаправить в WhatsApp / Instagram / звонок. */
export async function GET(request: Request, ctx: Context) {
  const found = await resolve(ctx);
  if (!found) return new NextResponse(null, { status: 404, headers: NO_STORE });
  const { kind, place } = found;

  let target: string | null;
  if (kind === "whatsapp") {
    const { dates, guests, locale } = parseGoParams(
      new URL(request.url).searchParams,
    );
    const t = await getTranslations({ locale, namespace: "Place" });
    const text = t("whatsappText", {
      site: SITE_NAME,
      name: placeName(place, locale),
      dates: dates ? formatStay(dates, locale) : "none",
      guests: guests ? String(guests) : "none",
    });
    target = whatsappUrl(place.whatsapp_phone, text);
  } else if (kind === "phone") {
    target = `tel:${place.whatsapp_phone}`;
  } else {
    target = /^https?:\/\//i.test(place.instagram_url ?? "")
      ? place.instagram_url
      : null;
  }
  if (!target)
    return new NextResponse(null, { status: 404, headers: NO_STORE });

  await track(request, kind, place.id);
  return NextResponse.redirect(target, { status: 302, headers: NO_STORE });
}

/** Только записать клик (для tel:-ссылки: navigator.sendBeacon при нажатии). */
export async function POST(request: Request, ctx: Context) {
  const found = await resolve(ctx);
  if (!found) return new NextResponse(null, { status: 404, headers: NO_STORE });
  await track(request, found.kind, found.place.id);
  return new NextResponse(null, { status: 204, headers: NO_STORE });
}
