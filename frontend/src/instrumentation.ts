import type { Instrumentation } from "next";
import { errorReport } from "@/lib/errorReport";

/**
 * Ошибки на сервере сайта (страницы, маршруты, server actions) — бэкенду,
 * а он шлёт их админу в Telegram. Без API_URL и INTERNAL_API_SECRET — только лог.
 */
export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context,
) => {
  const url = process.env.API_URL?.replace(/\/$/, "");
  const secret = process.env.INTERNAL_API_SECRET;
  if (!url || !secret) return;
  try {
    await fetch(`${url}/internal/errors`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-internal-secret": secret,
      },
      body: JSON.stringify(errorReport(error, request, context)),
      signal: AbortSignal.timeout(3000),
    });
  } catch (e) {
    // Бэкенд недоступен — об этом сообщит UptimeRobot (docs/SETUP.md).
    console.error("onRequestError: не удалось отправить ошибку", e);
  }
};
