import { NextResponse } from "next/server";
import { sendWeeklyReminders } from "@/lib/bot/notify";

/**
 * Напоминание владельцам «Обновите занятость на выходные».
 * Vercel Cron вызывает по четвергам (vercel.json) с заголовком
 * Authorization: Bearer <CRON_SECRET>.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`)
    return new NextResponse("Unauthorized", { status: 401 });

  const result = await sendWeeklyReminders();
  return NextResponse.json(result, {
    headers: { "Cache-Control": "no-store" },
  });
}
