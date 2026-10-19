import { NextResponse } from "next/server";
import { runDailyJobs } from "@/lib/bot/daily";

/**
 * Ежедневный запуск (vercel.json): истёкший Pro → free, напоминание
 * владельцу за 5 дней до конца Pro, по четвергам — «Обновите занятость
 * на выходные». Vercel Cron присылает Authorization: Bearer <CRON_SECRET>.
 * Одна задача вместо нескольких — у бесплатного Vercel лимит на cron.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`)
    return new NextResponse("Unauthorized", { status: 401 });

  const result = await runDailyJobs();
  return NextResponse.json(result, {
    headers: { "Cache-Control": "no-store" },
  });
}
