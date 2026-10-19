import { Injectable } from '@nestjs/common';
import { type Prisma, PrismaClient } from '../generated/prisma/client';
import { CARD_SELECT, UNIT_SELECT } from '../common/place-data';
import { UNIT_ORDER } from '../units/units';
import { dbDate, isoDate } from '../prisma/dates';
import { isReviewToken, reviewTokenHash } from '../common/reviews';
import { AMENITIES, type Amenity } from '../shared/places/constants';
import { firstName } from '../shared/reviews/validate';

export type CatalogQuery = {
  drive?: number;
  guests?: number;
  price_min?: number;
  price_max?: number;
  amenities: Amenity[];
  type?: string;
  dir?: string;
  sort?: string;
};

/** Больше объектов в каталоге пока не ожидаем; при росте — перенести фильтр дат в SQL. */
const MAX_PLACES = 1000;

const PUBLISHED = { status: 'published' } as const;

/** Сколько отзывов показываем на странице объекта. */
const REVIEWS_ON_PAGE = 20;

const int = (value: unknown): number | undefined => {
  const n = Number(value);
  return value !== undefined && value !== '' && Number.isInteger(n)
    ? n
    : undefined;
};

export function parseCatalogQuery(
  q: Record<string, string | undefined>,
): CatalogQuery {
  const amenities = (q.amenities ?? '')
    .split(',')
    .filter((a): a is Amenity => a in AMENITIES);
  return {
    drive: int(q.drive),
    guests: int(q.guests),
    price_min: int(q.price_min),
    price_max: int(q.price_max),
    amenities,
    type: q.type || undefined,
    dir: q.dir || undefined,
    sort: q.sort || undefined,
  };
}

/** Публичные данные: только опубликованные объекты и их занятость. */
@Injectable()
export class PublicService {
  constructor(private readonly prisma: PrismaClient) {}

  findPlaces(q: CatalogQuery) {
    const where: Prisma.PlaceWhereInput = { ...PUBLISHED };
    if (q.drive) where.drive_minutes = { lte: q.drive };
    if (q.guests) where.capacity_max = { gte: q.guests };
    if (q.price_min !== undefined || q.price_max !== undefined)
      where.price_from = { gte: q.price_min, lte: q.price_max };
    for (const amenity of q.amenities) where[amenity] = true;
    if (q.type) where.type = q.type as Prisma.PlaceWhereInput['type'];
    if (q.dir) where.direction = q.dir as Prisma.PlaceWhereInput['direction'];

    const orderBy: Prisma.PlaceOrderByWithRelationInput[] = [];
    if (q.sort === 'price')
      orderBy.push({ price_from: { sort: 'asc', nulls: 'last' } });
    else if (q.sort === 'near')
      orderBy.push({ drive_minutes: { sort: 'asc', nulls: 'last' } });
    // «Рекомендуемые»: новые сверху, продвижение — на фронтенде, после фильтра дат.
    orderBy.push({ created_at: 'desc' }, { id: 'asc' });

    return this.prisma.place.findMany({
      where,
      select: CARD_SELECT,
      orderBy,
      take: MAX_PLACES,
    });
  }

  findPlacesByIds(ids: string[]) {
    return this.prisma.place.findMany({
      where: { ...PUBLISHED, id: { in: ids } },
      select: CARD_SELECT,
    });
  }

  async placeBySlug(slug: string) {
    const place = await this.prisma.place.findFirst({
      where: { ...PUBLISHED, slug },
      include: {
        units: { select: UNIT_SELECT, orderBy: [...UNIT_ORDER] },
        reviews: {
          where: { status: 'published' },
          select: {
            id: true,
            author_name: true,
            rating: true,
            text: true,
            stay_date: true,
            published_at: true,
          },
          orderBy: { published_at: 'desc' },
          take: REVIEWS_ON_PAGE,
        },
      },
    });
    if (!place) return null;
    // Фамилию гостя на сайт не отдаём.
    return {
      ...place,
      reviews: place.reviews.map((r) => ({
        ...r,
        author_name: firstName(r.author_name),
      })),
    };
  }

  /** Страница «Оставьте отзыв» по ссылке из WhatsApp. */
  async reviewByToken(token: string) {
    if (!isReviewToken(token)) return null;
    const review = await this.prisma.review.findUnique({
      where: { token_hash: reviewTokenHash(token) },
      select: {
        status: true,
        author_name: true,
        stay_date: true,
        lead: { select: { date_to: true } },
        place: {
          select: {
            name_ru: true,
            name_kk: true,
            slug: true,
            status: true,
            photos: true,
            photos_permission: true,
          },
        },
      },
    });
    if (!review) return null;
    const { lead, place, ...rest } = review;
    return {
      ...rest,
      date_to: lead.date_to,
      place: {
        name_ru: place.name_ru,
        name_kk: place.name_kk,
        slug: place.status === 'published' ? place.slug : null,
        photo: place.photos_permission ? (place.photos[0] ?? null) : null,
      },
    };
  }

  placeById(id: string) {
    return this.prisma.place.findFirst({ where: { ...PUBLISHED, id } });
  }

  /** Похожие: то же направление или тот же тип (порядок — на фронтенде). */
  async similar(id: string) {
    const place = await this.placeById(id);
    if (!place) return null;
    return this.prisma.place.findMany({
      where: {
        ...PUBLISHED,
        id: { not: id },
        OR: [{ direction: place.direction }, { type: place.type }],
      },
      select: CARD_SELECT,
      take: 12,
    });
  }

  /** Когда владельцы последний раз обновляли занятость (только опубликованные). */
  private async lastUpdated(placeId?: string) {
    const rows = await this.prisma.availability.groupBy({
      by: ['place_id'],
      where: { place: PUBLISHED, ...(placeId ? { place_id: placeId } : {}) },
      _max: { updated_at: true },
    });
    return rows.map((r) => ({
      place_id: r.place_id,
      last_updated_at: r._max.updated_at,
    }));
  }

  /** Статусы (и цены на праздники) всех опубликованных объектов на одну ночь. */
  async night(date: string) {
    const [rows, freshness] = await Promise.all([
      this.prisma.availability.findMany({
        where: { date: dbDate(date), place: PUBLISHED },
        select: { place_id: true, status: true, price: true },
      }),
      this.lastUpdated(),
    ]);
    return { rows, freshness };
  }

  /**
   * Занятость на несколько ночей (from..to включительно): строки объектов,
   * строки домиков и свежесть. placeId — только один объект (его страница).
   */
  async nights(from: string, to: string, placeId?: string) {
    const date = { gte: dbDate(from), lte: dbDate(to) };
    const [rows, unitRows, freshness] = await Promise.all([
      this.prisma.availability.findMany({
        where: {
          date,
          place: PUBLISHED,
          ...(placeId ? { place_id: placeId } : {}),
        },
        select: {
          place_id: true,
          date: true,
          status: true,
          price: true,
          free_capacity: true,
        },
      }),
      this.prisma.unitAvailability.findMany({
        where: {
          date,
          unit: { place: PUBLISHED, ...(placeId ? { place_id: placeId } : {}) },
        },
        select: { unit_id: true, date: true, status: true, price: true },
      }),
      this.lastUpdated(placeId),
    ]);
    return { rows, unitRows, freshness };
  }

  /** Занятость объекта на период + когда владелец последний раз обновлял. */
  async placeAvailability(placeId: string, from: string, to: string) {
    const [rows, freshness] = await Promise.all([
      this.prisma.availability.findMany({
        where: {
          place_id: placeId,
          place: PUBLISHED,
          date: { gte: dbDate(from), lte: dbDate(to) },
        },
        select: { date: true, status: true },
      }),
      this.lastUpdated(placeId),
    ]);
    return {
      days: Object.fromEntries(rows.map((r) => [isoDate(r.date), r.status])),
      lastUpdatedAt: freshness[0]?.last_updated_at ?? null,
    };
  }

  sitemap() {
    return this.prisma.place.findMany({
      where: PUBLISHED,
      select: { slug: true, updated_at: true },
    });
  }

  collections() {
    return this.prisma.collection.findMany({
      where: { published: true },
      orderBy: [{ sort_order: 'asc' }, { title_ru: 'asc' }],
    });
  }

  collection(slug: string) {
    return this.prisma.collection.findFirst({
      where: { published: true, slug },
    });
  }

  async recordEvent(placeId: string, type: string) {
    const place = await this.placeById(placeId);
    if (!place) return false;
    await this.prisma.event.create({
      data: {
        place_id: placeId,
        type: type as Prisma.EventCreateManyInput['type'],
      },
    });
    return true;
  }
}
