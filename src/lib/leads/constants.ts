// Статусы заявки (enum lead_status) и подписи для админки.
export const LEAD_STATUSES = {
  new: "Новая",
  sent_to_owner: "Отправлена владельцу",
  confirmed: "Подтверждена",
  cancelled: "Отменена",
  no_answer: "Не дозвонились",
} as const;

export type LeadStatus = keyof typeof LEAD_STATUSES;

/** Защита от спама: не больше 3 заявок с одного IP за час (Этап 4 ТЗ). */
export const LEAD_RATE_LIMIT = { max: 3, window: "1 hour" } as const;

/** Имя скрытого поля-ловушки: люди его не видят, боты заполняют. */
export const HONEYPOT_FIELD = "website";
