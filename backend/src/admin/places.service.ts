import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma/client';
import { placeData } from '../common/place-data';
import { dbDate } from '../prisma/dates';
import { almatyToday, nextDays, toIsoDate } from '../shared/dates';
import {
  AVAILABILITY_DAYS,
  AVAILABILITY_STATUSES,
  type AvailabilityStatus,
  PLACE_STATUSES,
} from '../shared/places/constants';
import {
  type FieldError,
  type PlaceInput,
  type RawPlaceInput,
  validatePlaceInput,
} from '../shared/places/validate';
import { PLAN_FEATURES } from '../shared/pricing';
import { uniqueSlug } from '../shared/slug';
import { PHOTO_PATH } from '../photos/photos.service';
import { saveDays, syncCapacity } from '../units/units';

export type ImportRowResult = {
  line: number;
  name: string;
  ok: boolean;
  errors: string[];
  id?: string;
};

/** Slug, введённый вручную, должен быть свободен; автоматический — делаем уникальным. */
function resolveSlug(
  data: PlaceInput,
  manual: boolean,
  taken: Set<string>,
): string | FieldError {
  if (!taken.has(data.slug)) return data.slug;
  if (manual)
    return { field: 'slug', message: `Адрес (slug): «${data.slug}» уже занят` };
  return uniqueSlug(data.slug, taken);
}

@Injectable()
export class AdminPlacesService {
  constructor(private readonly prisma: PrismaClient) {}

  list(status?: string, q?: string) {
    const search = q?.trim();
    return this.prisma.place.findMany({
      where: {
        ...(status && Object.hasOwn(PLACE_STATUSES, status)
          ? { status: status as PlaceInput['status'] }
          : {}),
        ...(search
          ? {
              OR: [
                { name_ru: { contains: search, mode: 'insensitive' } },
                { slug: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        slug: true,
        name_ru: true,
        type: true,
        direction: true,
        status: true,
        price_from: true,
        updated_at: true,
        plan: true,
        pro_until: true,
        featured_until: true,
      },
      orderBy: { updated_at: 'desc' },
    });
  }

  async get(id: string) {
    const place = await this.prisma.place.findUnique({ where: { id } });
    if (!place) throw new NotFoundException({ error: 'Объект не найден' });
    return place;
  }

  private async takenSlugs(exceptId?: string): Promise<Set<string>> {
    const rows = await this.prisma.place.findMany({
      where: exceptId ? { id: { not: exceptId } } : {},
      select: { slug: true },
    });
    return new Set(rows.map((r) => r.slug));
  }

  /** Создание (id = null) или изменение объекта. */
  async save(
    id: string | null,
    raw: RawPlaceInput,
    photos: unknown,
  ): Promise<{ id: string } | { errors: FieldError[] }> {
    const result = validatePlaceInput(raw);
    if (!result.ok) return { errors: result.errors };
    const today = toIsoDate(almatyToday(new Date()));
    if (
      result.data.plan === 'pro' &&
      result.data.pro_until &&
      result.data.pro_until < today
    )
      return {
        errors: [
          {
            field: 'pro_until',
            message:
              'Pro до: дата уже прошла — продлите срок или выберите Free',
          },
        ],
      };

    if (
      !Array.isArray(photos) ||
      !photos.every((p) => typeof p === 'string' && PHOTO_PATH.test(p))
    )
      return {
        errors: [{ field: 'photos', message: 'Фото: неверный список файлов' }],
      };
    if (photos.length > PLAN_FEATURES.pro.photos)
      return {
        errors: [
          {
            field: 'photos',
            message: `Фото: не больше ${PLAN_FEATURES.pro.photos} (на Free на сайте видны первые ${PLAN_FEATURES.free.photos})`,
          },
        ],
      };

    const slug = resolveSlug(
      result.data,
      Boolean(raw.slug?.trim()),
      await this.takenSlugs(id ?? undefined),
    );
    if (typeof slug !== 'string') return { errors: [slug] };

    const data = {
      ...placeData(result.data),
      slug,
      photos: photos as string[],
    };
    try {
      const saved = id
        ? await this.prisma.place.update({
            where: { id },
            data,
            select: { id: true },
          })
        : await this.prisma.place.create({ data, select: { id: true } });
      // С домиками вместимость объекта — сумма их мест, а не поле формы.
      await syncCapacity(saved.id);
      return saved;
    } catch (e) {
      return {
        errors: [
          {
            field: 'form',
            message: `Ошибка базы: ${e instanceof Error ? e.message : String(e)}`,
          },
        ],
      };
    }
  }

  /** Импорт CSV по одной строке: ошибка в одной не ломает остальные. */
  async import(
    rows: { line: number; raw: RawPlaceInput }[],
  ): Promise<ImportRowResult[]> {
    const taken = await this.takenSlugs();
    const results: ImportRowResult[] = [];

    for (const { line, raw } of rows) {
      const name = raw.name_ru?.trim() || '(без названия)';
      const result = validatePlaceInput(raw);
      if (!result.ok) {
        results.push({
          line,
          name,
          ok: false,
          errors: result.errors.map((e) => e.message),
        });
        continue;
      }
      const slug = resolveSlug(result.data, Boolean(raw.slug?.trim()), taken);
      if (typeof slug !== 'string') {
        results.push({ line, name, ok: false, errors: [slug.message] });
        continue;
      }
      try {
        const saved = await this.prisma.place.create({
          data: { ...placeData(result.data), slug },
          select: { id: true },
        });
        taken.add(slug);
        results.push({ line, name, ok: true, errors: [], id: saved.id });
      } catch (e) {
        results.push({
          line,
          name,
          ok: false,
          errors: [
            `Ошибка базы: ${e instanceof Error ? e.message : String(e)}`,
          ],
        });
      }
    }
    return results;
  }

  /** Сетка занятости: объекта или одного домика (unitId). */
  async availability(id: string, from: string, to: string, unitId?: string) {
    const place = await this.prisma.place.findUnique({
      where: { id },
      select: { id: true, name_ru: true },
    });
    if (!place) throw new NotFoundException({ error: 'Объект не найден' });
    const date = { gte: dbDate(from), lte: dbDate(to) };
    const select = { date: true, status: true, updated_at: true } as const;
    const rows = unitId
      ? await this.prisma.unitAvailability.findMany({
          where: { unit_id: unitId, unit: { place_id: id }, date },
          select,
        })
      : await this.prisma.availability.findMany({
          where: { place_id: id, date },
          select,
        });
    return { place, rows };
  }

  async setAvailability(
    placeId: string,
    date: string,
    status: unknown,
    unitId: string | null = null,
  ): Promise<{ error?: string; updatedAt?: Date }> {
    if (!nextDays(new Date(), AVAILABILITY_DAYS).includes(date))
      return { error: 'Дата вне диапазона 60 дней' };
    if (
      status !== null &&
      !(
        typeof status === 'string' &&
        Object.hasOwn(AVAILABILITY_STATUSES, status)
      )
    )
      return { error: 'Неизвестный статус' };
    if (unitId) {
      const unit = await this.prisma.unit.findFirst({
        where: { id: unitId, place_id: placeId },
        select: { id: true },
      });
      if (!unit) return { error: 'Домик не найден' };
    }
    await saveDays(placeId, unitId, [
      { date, status: status as AvailabilityStatus | null },
    ]);
    return status === null ? {} : { updatedAt: new Date() };
  }
}
