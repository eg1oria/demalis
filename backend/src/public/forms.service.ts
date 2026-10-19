import { Injectable } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma/client';
import { Prisma } from '../generated/prisma/client';
import { runInBackground } from '../common/notify';
import { hitRateLimit } from '../common/rate-limit';
import { siteUrl } from '../common/site';
import { notifyOwnerAboutLead } from '../bot/notify';
import { dbDate, dbDateOrNull } from '../prisma/dates';
import { almatyToday, toIsoDate } from '../shared/dates';
import { HONEYPOT_FIELD, LEAD_RATE_LIMIT } from '../shared/leads/constants';
import { leadTelegramMessage } from '../shared/leads/message';
import {
  type LeadErrorCode,
  type LeadField,
  type RawLeadInput,
  validateLead,
} from '../shared/leads/validate';
import { groupRequestTelegramMessage } from '../shared/groups/message';
import {
  type GroupErrorCode,
  type GroupField,
  validateGroupRequest,
} from '../shared/groups/validate';
import { ownerRequestTelegramMessage } from '../shared/owners/message';
import { reviewTelegramMessage } from '../shared/reviews/message';
import {
  type ReviewErrorCode,
  type ReviewField,
  validateReview,
} from '../shared/reviews/validate';
import { isReviewToken, reviewTokenHash } from '../common/reviews';
import {
  type OwnerRequestError,
  type OwnerRequestField,
  validateOwnerRequest,
} from '../shared/owners/request';
import { rateLimitKey } from '../shared/request';
import { slugify, uniqueSlug } from '../shared/slug';
import { sendTelegramMessage } from '../telegram/send';
import { isUuid, str } from '../common/uuid';

export type LeadResult =
  | {
      status: 'error';
      errors?: Partial<Record<LeadField, LeadErrorCode>>;
      form?: 'rateLimit' | 'unavailable' | 'server';
    }
  | {
      status: 'sent';
      dates: { checkIn: string; checkOut: string } | null;
      guests: number | null;
    };

export type OwnerRequestResult =
  | {
      status: 'error';
      errors?: Partial<Record<OwnerRequestField, OwnerRequestError>>;
      form?: 'rateLimit' | 'server';
    }
  | { status: 'sent' };

export type GroupRequestResult =
  | {
      status: 'error';
      errors?: Partial<Record<GroupField, GroupErrorCode>>;
      form?: 'rateLimit' | 'server';
    }
  | { status: 'sent' };

export type ReviewResult =
  | {
      status: 'error';
      errors?: Partial<Record<ReviewField, ReviewErrorCode>>;
      form?: 'rateLimit' | 'used' | 'notFound';
    }
  | { status: 'sent' };

const REVIEW_FIELDS: ReviewField[] = ['rating', 'text', 'name', 'consent'];

const LEAD_FIELDS: LeadField[] = [
  'name',
  'phone',
  'dateFrom',
  'dateTo',
  'guests',
  'comment',
  'consent',
];
const OWNER_FIELDS: OwnerRequestField[] = [
  'name',
  'phone',
  'instagram',
  'direction',
  'type',
  'consent',
];

const GROUP_FIELDS: GroupField[] = [
  'name',
  'phone',
  'occasion',
  'guests',
  'dateFrom',
  'dateTo',
  'budget',
  'direction',
  'amenities',
  'comment',
  'consent',
];

function pick<F extends string>(body: Record<string, unknown>, fields: F[]) {
  const raw: Partial<Record<F, string>> = {};
  for (const field of fields) {
    const value = body[field];
    if (typeof value === 'string') raw[field] = value;
  }
  return raw;
}

function rateSecret(): string {
  const secret = process.env.RATE_LIMIT_SECRET;
  if (!secret)
    throw new Error('Не задан RATE_LIMIT_SECRET — см. backend/.env.example');
  return secret;
}

/** Формы с сайта: заявка гостя, «Подберём за вас» и заявка владельца «Добавить объект». */
@Injectable()
export class FormsService {
  constructor(private readonly prisma: PrismaClient) {}

  async submitLead(
    body: Record<string, unknown>,
    ip: string,
  ): Promise<LeadResult> {
    // Ловушка заполнена — это бот. Делаем вид, что всё хорошо, и ничего не сохраняем.
    if (str(body[HONEYPOT_FIELD]).trim())
      return { status: 'sent', dates: null, guests: null };

    const placeId = body.placeId;
    const place = isUuid(placeId)
      ? await this.prisma.place.findFirst({
          where: { id: placeId, status: 'published' },
          select: { id: true, name_ru: true, name_kk: true },
        })
      : null;
    if (!place) return { status: 'error', form: 'unavailable' };

    const raw: RawLeadInput = pick(body, LEAD_FIELDS);
    const result = validateLead(raw, toIsoDate(almatyToday(new Date())));
    if (!result.ok) return { status: 'error', errors: result.errors };
    const lead = result.data;

    // Лимит считаем только по прошедшим проверку заявкам: ошибка в телефоне не «съедает» попытку.
    const allowed = await hitRateLimit(
      this.prisma,
      rateLimitKey(ip, rateSecret()),
      LEAD_RATE_LIMIT.max,
      LEAD_RATE_LIMIT.window,
    );
    if (!allowed) return { status: 'error', form: 'rateLimit' };

    const saved = await this.prisma.lead.create({
      data: {
        ...lead,
        date_from: dbDate(lead.date_from),
        date_to: dbDate(lead.date_to),
        place_id: place.id,
      },
      select: { id: true },
    });

    // Уведомления — после ответа посетителю, чтобы не ждать Telegram.
    runInBackground('submitLead owner bot', () =>
      notifyOwnerAboutLead({ ...lead, id: saved.id }, place),
    );
    runInBackground('submitLead telegram', () => {
      const site = siteUrl();
      return sendTelegramMessage(
        process.env.ADMIN_TELEGRAM_CHAT_ID,
        leadTelegramMessage(
          lead,
          place.name_ru,
          site ? `${site}/admin/leads` : null,
        ),
      );
    });

    return {
      status: 'sent',
      dates: { checkIn: lead.date_from, checkOut: lead.date_to },
      guests: lead.guests,
    };
  }

  /** «Подберём за вас»: сохраняем заявку большой компании и пишем админу. */
  async submitGroupRequest(
    body: Record<string, unknown>,
    ip: string,
  ): Promise<GroupRequestResult> {
    if (str(body[HONEYPOT_FIELD]).trim()) return { status: 'sent' };

    const result = validateGroupRequest(
      pick(body, GROUP_FIELDS),
      toIsoDate(almatyToday(new Date())),
    );
    if (!result.ok) return { status: 'error', errors: result.errors };
    const request = result.data;

    const allowed = await hitRateLimit(
      this.prisma,
      rateLimitKey(ip, rateSecret(), 'group'),
      LEAD_RATE_LIMIT.max,
      LEAD_RATE_LIMIT.window,
    );
    if (!allowed) return { status: 'error', form: 'rateLimit' };

    await this.prisma.groupRequest.create({
      data: {
        ...request,
        date_from: dbDateOrNull(request.date_from),
        date_to: dbDateOrNull(request.date_to),
      },
      select: { id: true },
    });

    runInBackground('submitGroupRequest telegram', () => {
      const site = siteUrl();
      return sendTelegramMessage(
        process.env.ADMIN_TELEGRAM_CHAT_ID,
        groupRequestTelegramMessage(
          request,
          site ? `${site}/admin/groups` : null,
        ),
      );
    });
    return { status: 'sent' };
  }

  /** Отзыв гостя по ссылке: один раз, дальше — проверка админом. */
  async submitReview(
    token: string,
    body: Record<string, unknown>,
    ip: string,
  ): Promise<ReviewResult> {
    if (str(body[HONEYPOT_FIELD]).trim()) return { status: 'sent' };
    if (!isReviewToken(token)) return { status: 'error', form: 'notFound' };

    const review = await this.prisma.review.findUnique({
      where: { token_hash: reviewTokenHash(token) },
      select: { id: true, status: true, place: { select: { name_ru: true } } },
    });
    if (!review) return { status: 'error', form: 'notFound' };
    if (review.status !== 'invited') return { status: 'error', form: 'used' };

    const result = validateReview(pick(body, REVIEW_FIELDS));
    if (!result.ok) return { status: 'error', errors: result.errors };

    const allowed = await hitRateLimit(
      this.prisma,
      rateLimitKey(ip, rateSecret(), 'review'),
      LEAD_RATE_LIMIT.max,
      LEAD_RATE_LIMIT.window,
    );
    if (!allowed) return { status: 'error', form: 'rateLimit' };

    // Только из «invited»: две вкладки с одной ссылкой не запишут два отзыва.
    const { count } = await this.prisma.review.updateMany({
      where: { id: review.id, status: 'invited' },
      data: { ...result.data, status: 'pending', submitted_at: new Date() },
    });
    if (!count) return { status: 'error', form: 'used' };

    runInBackground('submitReview telegram', () => {
      const site = siteUrl();
      return sendTelegramMessage(
        process.env.ADMIN_TELEGRAM_CHAT_ID,
        reviewTelegramMessage(
          result.data,
          review.place.name_ru,
          site ? `${site}/admin/reviews` : null,
        ),
      );
    });
    return { status: 'sent' };
  }

  /** Свободный slug: занятые с тем же началом + «-2», «-3»… */
  private async freeSlug(name: string): Promise<string> {
    const base = slugify(name) || 'place';
    const rows = await this.prisma.place.findMany({
      where: { slug: { startsWith: base } },
      select: { slug: true },
    });
    return uniqueSlug(base, new Set(rows.map((r) => r.slug)));
  }

  /** Создаёт объект-черновик и уведомляет админа в Telegram (Этап 7). */
  async submitOwnerRequest(
    body: Record<string, unknown>,
    ip: string,
  ): Promise<OwnerRequestResult> {
    if (str(body[HONEYPOT_FIELD]).trim()) return { status: 'sent' };

    const result = validateOwnerRequest(pick(body, OWNER_FIELDS));
    if (!result.ok) return { status: 'error', errors: result.errors };
    const request = result.data;

    const allowed = await hitRateLimit(
      this.prisma,
      rateLimitKey(ip, rateSecret(), 'owner'),
      LEAD_RATE_LIMIT.max,
      LEAD_RATE_LIMIT.window,
    );
    if (!allowed) return { status: 'error', form: 'rateLimit' };

    // Две заявки с одинаковым названием одновременно — повторяем с новым slug.
    let placeId: string | null = null;
    for (let attempt = 0; attempt < 3 && !placeId; attempt++) {
      try {
        const place = await this.prisma.place.create({
          data: {
            slug: await this.freeSlug(request.name),
            name_ru: request.name,
            type: request.type,
            direction: request.direction,
            whatsapp_phone: request.phone,
            instagram_url: request.instagram_url,
            photos_permission: true,
            status: 'draft',
          },
          select: { id: true },
        });
        placeId = place.id;
      } catch (e) {
        if (!(
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === 'P2002'
        ))
          throw e;
      }
    }
    if (!placeId) return { status: 'error', form: 'server' };

    runInBackground('submitOwnerRequest telegram', () => {
      const site = siteUrl();
      return sendTelegramMessage(
        process.env.ADMIN_TELEGRAM_CHAT_ID,
        ownerRequestTelegramMessage(
          request,
          site ? `${site}/admin/places/${placeId}` : null,
        ),
      );
    });
    return { status: 'sent' };
  }
}
