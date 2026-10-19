import { DIRECTIONS, PLACE_TYPES } from "@/lib/places/constants";
import type { OwnerRequest } from "./request";

const escapeHtml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Админу в Telegram: владелец оставил заявку «Добавить объект» (parse_mode HTML). */
export function ownerRequestTelegramMessage(
  request: OwnerRequest,
  adminUrl: string | null,
): string {
  const lines = [
    `<b>Новый объект от владельца</b> — ${escapeHtml(request.name)}`,
    `${PLACE_TYPES[request.type]} · ${DIRECTIONS[request.direction]}`,
    `Телефон: ${request.phone}`,
  ];
  if (request.instagram_url)
    lines.push(`Instagram: ${escapeHtml(request.instagram_url)}`);
  lines.push("Согласие на фото и данные: да", "Статус: черновик");
  if (adminUrl)
    lines.push("", `<a href="${escapeHtml(adminUrl)}">Открыть в админке</a>`);
  return lines.join("\n");
}
