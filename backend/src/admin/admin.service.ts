import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, PrismaClient } from '../generated/prisma/client';
import { placeStats, placeStatsBetween } from '../common/stats';
import { generateLinkCode } from '../bot/linkCode';
import {
  holidayRows,
  isNightPrice,
  sendHolidaySurvey,
  setHolidayNight,
} from '../bot/holiday';
import { ownerReport, sendOwnerReport } from '../bot/monthly';
import { getBotUsername } from '../telegram/api';
import { dbDate } from '../prisma/dates';
import {
  almatyToday,
  isIsoDate,
  type IsoDate,
  type IsoMonth,
  monthRange,
  shiftMonth,
  toIsoDate,
} from '../shared/dates';
import {
  AVAILABILITY_STATUSES,
  type AvailabilityStatus,
} from '../shared/places/constants';
import { GROUP_STATUSES } from '../shared/groups/validate';
import { LEAD_STATUSES } from '../shared/leads/constants';
import { validatePayment } from '../shared/payments/validate';
import { normalizeKzPhone } from '../shared/phone';
import { isValidSlug } from '../shared/slug';
import { str } from '../common/uuid';

const isUnique = (e: unknown) =>
  e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002';

/** Владельцы, заявки, подборки, оплаты и статистика для админки. */
@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaClient) {}

  // ── Владельцы ───────────────────────────────────────────────────────────

  owners() {
    return this.prisma.owner.findMany({
      select: {
        id: true,
        name: true,
        phone: true,
        telegram_chat_id: true,
        link_code: true,
        places: { select: { id: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async owner(id: string) {
    const owner = await this.prisma.owner.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        phone: true,
        telegram_chat_id: true,
        link_code: true,
        language: true,
        places: { select: { id: true, name_ru: true, status: true } },
      },
    });
    if (!owner) throw new NotFoundException({ error: 'Владелец не найден' });
    const botUsername = owner.link_code ? await getBotUsername() : null;
    return { ...owner, botUsername };
  }

  async saveOwner(
    id: string | null,
    body: { name?: unknown; phone?: unknown },
  ): Promise<{ id: string } | { error: string }> {
    const name = str(body.name).trim().replace(/\s+/g, ' ');
    const rawPhone = str(body.phone).trim();
    if (!name) return { error: 'Укажите имя владельца' };
    if (name.length > 100) return { error: 'Имя длиннее 100 символов' };
    const phone = rawPhone ? normalizeKzPhone(rawPhone) : null;
    if (rawPhone && !phone)
      return {
        error: 'Телефон: нужен казахстанский номер, например +7 701 123 45 67',
      };

    const data = { name, phone };
    return id
      ? this.prisma.owner.update({ where: { id }, data, select: { id: true } })
      : this.prisma.owner.create({ data, select: { id: true } });
  }

  /** Новый одноразовый код привязки бота (старый перестаёт работать). */
  async createLinkCode(ownerId: string) {
    // Совпадение кодов почти невозможно, но на всякий случай — пара попыток.
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await this.prisma.owner.update({
          where: { id: ownerId },
          data: { link_code: generateLinkCode() },
        });
        return;
      } catch (e) {
        if (!isUnique(e)) throw e;
      }
    }
  }

  async unlinkTelegram(ownerId: string) {
    await this.prisma.owner.update({
      where: { id: ownerId },
      data: { telegram_chat_id: null, link_code: null },
    });
  }

  async ownerReport(ownerId: string, month: IsoMonth) {
    const { report } = await ownerReport(ownerId, month);
    return { report };
  }

  async sendOwnerReport(ownerId: string, month: IsoMonth) {
    return { result: await sendOwnerReport(ownerId, month) };
  }

  // ── Праздники: опрос владельцев про одну ночь ───────────────────────────

  holidays(night: IsoDate) {
    return holidayRows(night);
  }

  /** Админ отмечает статус и цену за владельца (например, после звонка). */
  async setHoliday(
    placeId: string,
    body: Record<string, unknown>,
  ): Promise<{ error?: string }> {
    const { night, status, price } = body;
    if (!isIsoDate(night)) return { error: 'Нужна дата ночи YYYY-MM-DD' };
    if (
      status !== null &&
      !(typeof status === 'string' && status in AVAILABILITY_STATUSES)
    )
      return { error: 'Неизвестный статус' };
    if (price !== null && !isNightPrice(price))
      return { error: 'Цена — целое число от 1 000 до 5 000 000 ₸ или пусто' };
    const place = await this.prisma.place.findUnique({
      where: { id: placeId },
      select: { id: true },
    });
    if (!place) throw new NotFoundException({ error: 'Объект не найден' });
    await setHolidayNight(
      placeId,
      night,
      status as AvailabilityStatus | null,
      status ? price : null,
    );
    return {};
  }

  async sendHolidaySurvey(
    night: unknown,
  ): Promise<{ error: string } | { result: { sent: number; failed: number } }> {
    if (!isIsoDate(night)) return { error: 'Нужна дата ночи YYYY-MM-DD' };
    if (night < toIsoDate(almatyToday(new Date())))
      return { error: 'Эта ночь уже прошла' };
    try {
      return { result: await sendHolidaySurvey(night) };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }

  // ── Заявки ──────────────────────────────────────────────────────────────

  leads(status: string | undefined, limit: number) {
    return this.prisma.lead.findMany({
      where:
        status && status in LEAD_STATUSES
          ? { status: status as keyof typeof LEAD_STATUSES }
          : {},
      include: { place: { select: { id: true, name_ru: true } } },
      orderBy: { created_at: 'desc' },
      take: limit,
    });
  }

  async updateLead(id: string, body: { status?: unknown; billable?: unknown }) {
    const data: Prisma.LeadUpdateInput = {};
    if (typeof body.status === 'string' && body.status in LEAD_STATUSES)
      data.status = body.status as keyof typeof LEAD_STATUSES;
    if (typeof body.billable === 'boolean') data.billable = body.billable;
    if (Object.keys(data).length === 0) return { error: 'Нечего менять' };
    await this.prisma.lead.update({ where: { id }, data });
    return {};
  }

  // ── Подбор для компаний ─────────────────────────────────────────────────

  groupRequests(status: string | undefined, limit: number) {
    return this.prisma.groupRequest.findMany({
      where:
        status && status in GROUP_STATUSES
          ? { status: status as keyof typeof GROUP_STATUSES }
          : {},
      orderBy: { created_at: 'desc' },
      take: limit,
    });
  }

  async updateGroupRequest(
    id: string,
    body: { status?: unknown; admin_note?: unknown },
  ) {
    const data: Prisma.GroupRequestUpdateInput = {};
    if (typeof body.status === 'string' && body.status in GROUP_STATUSES)
      data.status = body.status as keyof typeof GROUP_STATUSES;
    if (typeof body.admin_note === 'string') {
      const note = body.admin_note.trim();
      if (note.length > 2000) return { error: 'Заметка — до 2000 символов' };
      data.admin_note = note || null;
    }
    if (Object.keys(data).length === 0) return { error: 'Нечего менять' };
    const { count } = await this.prisma.groupRequest.updateMany({
      where: { id },
      data,
    });
    if (!count) throw new NotFoundException({ error: 'Не найдено' });
    return {};
  }

  // ── Подборки ────────────────────────────────────────────────────────────

  collections() {
    return this.prisma.collection.findMany({
      orderBy: [{ sort_order: 'asc' }, { title_ru: 'asc' }],
    });
  }

  async collection(id: string) {
    const row = await this.prisma.collection.findUnique({ where: { id } });
    if (!row) throw new NotFoundException({ error: 'Подборка не найдена' });
    return row;
  }

  /** Строку проверяет и нормализует фронтенд (фильтры каталога живут там). */
  async saveCollection(
    id: string | null,
    body: Record<string, unknown>,
  ): Promise<{ id: string } | { error: string }> {
    const str = (key: string) =>
      typeof body[key] === 'string' ? (body[key] as string).trim() : '';
    const slug = str('slug');
    const title_ru = str('title_ru');
    if (!title_ru) return { error: 'Укажите заголовок на русском' };
    if (!isValidSlug(slug))
      return {
        error:
          'Адрес (slug): только латиница, цифры и дефисы, например s-chanom',
      };
    const sort_order = Number(body.sort_order ?? 100);
    if (!Number.isInteger(sort_order))
      return { error: 'Порядок — целое число' };
    const night = str('night');
    if (night && !isIsoDate(night))
      return { error: 'Ночь — дата в формате ГГГГ-ММ-ДД или пусто' };

    const data = {
      slug,
      title_ru,
      title_kk: str('title_kk') || null,
      intro_ru: str('intro_ru') || null,
      intro_kk: str('intro_kk') || null,
      filters: str('filters'),
      night: night ? dbDate(night) : null,
      sort_order,
      published: body.published === true,
    };
    try {
      return id
        ? await this.prisma.collection.update({
            where: { id },
            data,
            select: { id: true },
          })
        : await this.prisma.collection.create({ data, select: { id: true } });
    } catch (e) {
      if (isUnique(e))
        throw new ConflictException({
          error: `Адрес «${slug}» уже занят другой подборкой`,
        });
      throw e;
    }
  }

  // ── Оплаты ──────────────────────────────────────────────────────────────

  payments(placeId: string) {
    return this.prisma.payment.findMany({
      where: { place_id: placeId },
      orderBy: [{ paid_at: 'desc' }, { created_at: 'desc' }],
    });
  }

  async addPayment(placeId: string, body: Record<string, unknown>) {
    const raw: Partial<
      Record<'amount' | 'kind' | 'paid_at' | 'comment', string>
    > = {};
    for (const key of ['amount', 'kind', 'paid_at', 'comment'] as const)
      if (typeof body[key] === 'string') raw[key] = body[key] as string;
    const result = validatePayment(raw);
    if (!result.ok) return { error: result.error };
    await this.prisma.payment.create({
      data: {
        ...result.data,
        paid_at: dbDate(result.data.paid_at),
        place_id: placeId,
      },
    });
    return { ok: true as const };
  }

  async deletePayment(placeId: string, paymentId: string) {
    await this.prisma.payment.deleteMany({
      where: { id: paymentId, place_id: placeId },
    });
  }

  // ── Статистика и отчёт за месяц ─────────────────────────────────────────

  private statsPlaces() {
    return this.prisma.place.findMany({
      select: { id: true, name_ru: true, status: true },
    });
  }

  async stats() {
    const [places, rows] = await Promise.all([
      this.statsPlaces(),
      placeStats(this.prisma),
    ]);
    return { places, rows };
  }

  async monthStats(month: IsoMonth) {
    const { from, to } = monthRange(month);
    const [places, rows] = await Promise.all([
      this.statsPlaces(),
      placeStatsBetween(this.prisma, from, to),
    ]);
    return { places, rows };
  }

  async billing(month: IsoMonth) {
    const { from, to } = monthRange(month);
    const [leads, payments, places] = await Promise.all([
      this.prisma.lead.findMany({
        where: { created_at: { gte: from, lt: to } },
        select: { place_id: true, billable: true },
      }),
      this.prisma.payment.findMany({
        where: {
          paid_at: {
            gte: dbDate(`${month}-01`),
            lt: dbDate(`${shiftMonth(month, 1)}-01`),
          },
        },
        select: {
          id: true,
          place_id: true,
          amount: true,
          kind: true,
          paid_at: true,
          comment: true,
        },
        orderBy: { paid_at: 'asc' },
      }),
      this.prisma.place.findMany({
        select: {
          id: true,
          name_ru: true,
          plan: true,
          pro_until: true,
          featured_until: true,
        },
      }),
    ]);
    return { leads, payments, places };
  }
}
