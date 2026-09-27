import type { LeadInput } from "./validate";

const escapeHtml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const formatDate = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
};

/** Сообщение админу в Telegram о новой заявке (parse_mode HTML). */
export function leadTelegramMessage(
  lead: LeadInput,
  placeName: string,
  adminUrl: string | null,
): string {
  const lines = [
    `<b>Новая заявка</b> — ${escapeHtml(placeName)}`,
    `Даты: ${formatDate(lead.date_from)} – ${formatDate(lead.date_to)}`,
    `Гостей: ${lead.guests}`,
    `Имя: ${escapeHtml(lead.name)}`,
    `Телефон: ${lead.phone}`,
  ];
  if (lead.comment) lines.push(`Комментарий: ${escapeHtml(lead.comment)}`);
  if (adminUrl)
    lines.push("", `<a href="${escapeHtml(adminUrl)}">Все заявки</a>`);
  return lines.join("\n");
}
