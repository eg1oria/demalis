"use client";

import { useState, useTransition } from "react";
import {
  sendHolidaySurvey,
  type SurveyResult,
} from "@/app/admin/(panel)/holidays/actions";
import { primaryButtonClass } from "./ui";

/** Разослать опрос владельцам с ботом (по сообщению на каждый объект). */
export function HolidaySurveyButton({ night }: { night: string }) {
  const [result, setResult] = useState<SurveyResult | null>(null);
  const [pending, startTransition] = useTransition();

  const onClick = () => {
    if (!confirm("Отправить опрос всем владельцам с ботом?")) return;
    setResult(null);
    startTransition(async () => setResult(await sendHolidaySurvey(night)));
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className={primaryButtonClass}
      >
        {pending ? "Отправляем…" : "Разослать опрос в боте"}
      </button>
      {result && (
        <p role="status" className="text-sm text-text-secondary">
          {result.error
            ? `Ошибка: ${result.error}`
            : `Отправлено: ${result.sent}${result.failed ? `, не дошло: ${result.failed}` : ""}`}
        </p>
      )}
    </div>
  );
}
