import { AMENITIES, DIRECTIONS } from '../places/constants';
import { GROUP_OCCASIONS, type GroupRequestInput } from './validate';

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const formatDate = (iso: string) => {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
};

/** Админу в Telegram: заявка «Подберём за вас» (parse_mode HTML). */
export function groupRequestTelegramMessage(
  request: GroupRequestInput,
  adminUrl: string | null,
): string {
  const lines = [
    `<b>Подбор для компании</b> — ${GROUP_OCCASIONS[request.occasion]}, ${request.guests} чел.`,
    request.date_from && request.date_to
      ? `Даты: ${formatDate(request.date_from)} – ${formatDate(request.date_to)}`
      : 'Даты: ещё не решили',
  ];
  if (request.budget !== null)
    lines.push(
      `Бюджет: ${new Intl.NumberFormat('ru-RU').format(request.budget)} ₸`,
    );
  if (request.direction)
    lines.push(`Направление: ${DIRECTIONS[request.direction]}`);
  if (request.amenities.length > 0)
    lines.push(
      `Нужно: ${request.amenities.map((a) => AMENITIES[a]).join(', ')}`,
    );
  lines.push(`Имя: ${escapeHtml(request.name)}`, `Телефон: ${request.phone}`);
  if (request.comment)
    lines.push(`Комментарий: ${escapeHtml(request.comment)}`);
  if (adminUrl)
    lines.push(
      '',
      `<a href="${escapeHtml(adminUrl)}">Все заявки на подбор</a>`,
    );
  return lines.join('\n');
}
