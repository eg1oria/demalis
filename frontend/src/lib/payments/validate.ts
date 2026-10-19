import type { Enums } from "@/lib/supabase/database.types";

export type PaymentKind = Enums<"payment_kind">;

/** Вид оплаты (enum payment_kind) и подпись в админке. */
export const PAYMENT_KINDS: Record<PaymentKind, string> = {
  pro: "Pro",
  promotion: "Продвижение",
  video: "Видео-обзор",
  leads: "Платные заявки",
  other: "Другое",
};

export type PaymentInput = {
  amount: number;
  kind: PaymentKind;
  paid_at: string;
  comment: string | null;
};

const MAX_AMOUNT = 100_000_000;

/** Проверка ручной отметки «оплачено». Ошибка — текст для админки (только русский). */
export function validatePayment(
  raw: Partial<Record<"amount" | "kind" | "paid_at" | "comment", string>>,
): { ok: true; data: PaymentInput } | { ok: false; error: string } {
  const amount = Number((raw.amount ?? "").replace(/[\s ]/g, ""));
  if (!Number.isInteger(amount) || amount <= 0 || amount > MAX_AMOUNT)
    return { ok: false, error: "Сумма: целое число тенге больше нуля" };

  const kind = raw.kind ?? "";
  if (!(kind in PAYMENT_KINDS))
    return { ok: false, error: "Выберите, за что оплата" };

  const paidAt = raw.paid_at ?? "";
  const date = new Date(`${paidAt}T00:00:00Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(paidAt) ||
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== paidAt
  )
    return { ok: false, error: "Дата оплаты: выберите дату" };

  const comment = raw.comment?.trim() ?? "";
  if (comment.length > 500)
    return { ok: false, error: "Комментарий длиннее 500 символов" };

  return {
    ok: true,
    data: {
      amount,
      kind: kind as PaymentKind,
      paid_at: paidAt,
      comment: comment || null,
    },
  };
}
