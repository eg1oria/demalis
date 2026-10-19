import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma/client';
import {
  inheritPlaceNights,
  resyncFuture,
  syncCapacity,
  UNIT_ORDER,
} from '../units/units';

export type UnitInput = {
  name_ru: string;
  name_kk: string | null;
  capacity: number;
  price_weekday: number | null;
  price_weekend: number | null;
  price_holiday: number | null;
  sort_order: number;
};

/** Проверка домика из формы админки. Ошибка — текст для админа. */
export function validateUnit(
  body: Record<string, unknown>,
): { data: UnitInput } | { error: string } {
  const text = (key: string) =>
    typeof body[key] === 'string' ? (body[key] as string).trim() : '';
  const num = (key: string): number | null | undefined => {
    const value = body[key];
    if (value === null || value === undefined || value === '') return null;
    const n = typeof value === 'number' ? value : Number(value);
    return Number.isInteger(n) ? n : undefined;
  };

  const name_ru = text('name_ru');
  if (!name_ru || name_ru.length > 80)
    return { error: 'Название домика (рус.): от 1 до 80 символов' };
  const capacity = num('capacity');
  if (!capacity || capacity < 1 || capacity > 100)
    return { error: 'Мест в домике — целое число от 1 до 100' };
  const prices = {} as Pick<
    UnitInput,
    'price_weekday' | 'price_weekend' | 'price_holiday'
  >;
  for (const key of [
    'price_weekday',
    'price_weekend',
    'price_holiday',
  ] as const) {
    const price = num(key);
    if (price === undefined || (price !== null && price < 0))
      return { error: 'Цены — целые числа в тенге или пусто' };
    prices[key] = price;
  }
  const sort_order = num('sort_order') ?? 100;
  if (sort_order === undefined) return { error: 'Порядок — целое число' };
  return {
    data: {
      name_ru,
      name_kk: text('name_kk') || null,
      capacity,
      ...prices,
      sort_order,
    },
  };
}

/** Домики объекта в админке. После любых правок — пересчёт объекта. */
@Injectable()
export class AdminUnitsService {
  constructor(private readonly prisma: PrismaClient) {}

  list(placeId: string) {
    return this.prisma.unit.findMany({
      where: { place_id: placeId },
      orderBy: [...UNIT_ORDER],
    });
  }

  async create(
    placeId: string,
    body: Record<string, unknown>,
  ): Promise<{ id: string } | { error: string }> {
    const result = validateUnit(body);
    if ('error' in result) return result;
    const place = await this.prisma.place.findUnique({
      where: { id: placeId },
      select: { _count: { select: { units: true } } },
    });
    if (!place) throw new NotFoundException({ error: 'Объект не найден' });
    const unit = await this.prisma.unit.create({
      data: { ...result.data, place_id: placeId },
      select: { id: true },
    });
    // Первый домик забирает отметки объекта — «Свободно» не пропадёт с сайта.
    if (place._count.units === 0) await inheritPlaceNights(placeId, unit.id);
    await this.afterChange(placeId);
    return unit;
  }

  async update(
    id: string,
    body: Record<string, unknown>,
  ): Promise<{ id: string } | { error: string }> {
    const result = validateUnit(body);
    if ('error' in result) return result;
    const unit = await this.prisma.unit.update({
      where: { id },
      data: result.data,
      select: { id: true, place_id: true },
    });
    await this.afterChange(unit.place_id);
    return { id: unit.id };
  }

  async remove(id: string): Promise<void> {
    const unit = await this.prisma.unit.delete({
      where: { id },
      select: { place_id: true },
    });
    await this.afterChange(unit.place_id);
  }

  private async afterChange(placeId: string) {
    await syncCapacity(placeId);
    await resyncFuture(placeId);
  }
}
