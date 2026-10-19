import type { IsoDate } from '../shared/dates';
import { almatyToday, toIsoDate } from '../shared/dates';
import type { AvailabilityStatus } from '../shared/places/constants';
import { db } from '../prisma/prisma';
import { dbDate, isoDate } from '../prisma/dates';

/**
 * Домики внутри объекта (Этап 14). Владелец отмечает занятость каждого
 * домика (unit_availability), а строку объекта в availability бэкенд
 * пересчитывает сам — по ней работают каталог, календарь и свежесть данных.
 */

export type UnitRow = {
  id: string;
  capacity: number;
  name_ru: string;
  name_kk: string | null;
};

/** Порядок домиков — как в админке и в боте (по нему же индекс в кнопках). */
export const UNIT_ORDER = [
  { sort_order: 'asc' },
  { name_ru: 'asc' },
  { id: 'asc' },
] as const;

export function placeUnits(placeId: string): Promise<UnitRow[]> {
  return db().unit.findMany({
    where: { place_id: placeId },
    select: { id: true, capacity: true, name_ru: true, name_kk: true },
    orderBy: [...UNIT_ORDER],
  });
}

/**
 * Статус объекта на ночь по его домикам:
 * - все домики свободны → «Свободно»;
 * - есть свободные или «мало мест» → «Мало мест»;
 * - все отмечены занятыми → «Занято»;
 * - свободных нет, но не все отмечены → неизвестно (null, строку удаляем).
 * free_capacity — сколько гостей помещается в незанятых домиках.
 */
export function aggregateNight(
  units: { capacity: number }[],
  statuses: (AvailabilityStatus | null)[],
): { status: AvailabilityStatus; free_capacity: number } | null {
  const open = units.filter(
    (_, i) => statuses[i] === 'free' || statuses[i] === 'limited',
  );
  if (open.length === 0)
    return units.length > 0 && statuses.every((s) => s === 'full')
      ? { status: 'full', free_capacity: 0 }
      : null;
  const allFree = units.length > 0 && statuses.every((s) => s === 'free');
  return {
    status: allFree ? 'free' : 'limited',
    free_capacity: open.reduce((sum, u) => sum + u.capacity, 0),
  };
}

/** Пересчитать строки объекта на эти ночи из занятости домиков. */
export async function syncPlaceNights(
  placeId: string,
  dates: IsoDate[],
): Promise<void> {
  const units = await placeUnits(placeId);
  if (units.length === 0 || dates.length === 0) return;
  const rows = await db().unitAvailability.findMany({
    where: {
      unit_id: { in: units.map((u) => u.id) },
      date: { in: dates.map(dbDate) },
    },
    select: { unit_id: true, date: true, status: true },
  });
  const byKey = new Map(
    rows.map((r) => [`${r.unit_id}|${isoDate(r.date)}`, r.status]),
  );
  const now = new Date();
  await db().$transaction(
    dates.map((date) => {
      const key = { place_id: placeId, date: dbDate(date) };
      const night = aggregateNight(
        units,
        units.map((u) => byKey.get(`${u.id}|${date}`) ?? null),
      );
      return night
        ? db().availability.upsert({
            where: { place_id_date: key },
            create: { ...key, ...night, updated_at: now },
            update: { ...night, updated_at: now },
          })
        : db().availability.deleteMany({ where: key });
    }),
  );
}

/**
 * Отметить ночи. У объекта без домиков — сама строка объекта; с домиками —
 * один домик (unitId) или все сразу (unitId = null), потом пересчёт объекта.
 * status = null — снять отметку (неизвестно).
 */
export async function saveDays(
  placeId: string,
  unitId: string | null,
  days: { date: IsoDate; status: AvailabilityStatus | null }[],
): Promise<void> {
  if (days.length === 0) return;
  const units = await placeUnits(placeId);
  const now = new Date();

  if (units.length === 0) {
    await db().$transaction(
      days.map(({ date, status }) => {
        const key = { place_id: placeId, date: dbDate(date) };
        return status
          ? db().availability.upsert({
              where: { place_id_date: key },
              create: { ...key, status, updated_at: now },
              update: { status, updated_at: now },
            })
          : db().availability.deleteMany({ where: key });
      }),
    );
    return;
  }

  const targets = unitId
    ? units.filter((u) => u.id === unitId).map((u) => u.id)
    : units.map((u) => u.id);
  if (targets.length === 0) return;
  await db().$transaction(
    targets.flatMap((id) =>
      days.map(({ date, status }) => {
        const key = { unit_id: id, date: dbDate(date) };
        return status
          ? db().unitAvailability.upsert({
              where: { unit_id_date: key },
              create: { ...key, status, updated_at: now },
              update: { status, updated_at: now },
            })
          : db().unitAvailability.deleteMany({ where: key });
      }),
    ),
  );
  await syncPlaceNights(
    placeId,
    days.map((d) => d.date),
  );
}

/** Статусы на даты: объекта (unitId = null) или одного домика. */
export async function dayStatuses(
  placeId: string,
  unitId: string | null,
  dates: IsoDate[],
): Promise<(AvailabilityStatus | null)[]> {
  const where = { date: { in: dates.map(dbDate) } };
  const rows = unitId
    ? await db().unitAvailability.findMany({
        where: { ...where, unit_id: unitId, unit: { place_id: placeId } },
        select: { date: true, status: true },
      })
    : await db().availability.findMany({
        where: { ...where, place_id: placeId },
        select: { date: true, status: true },
      });
  const byDate = new Map(rows.map((r) => [isoDate(r.date), r.status]));
  return dates.map((d) => byDate.get(d) ?? null);
}

/** Цена за ночь (праздники): объекту без домиков — в его строку, иначе всем домикам. */
export async function saveNightPrice(
  placeId: string,
  night: IsoDate,
  price: number | null,
): Promise<boolean> {
  const units = await placeUnits(placeId);
  const { count } =
    units.length === 0
      ? await db().availability.updateMany({
          where: { place_id: placeId, date: dbDate(night) },
          data: { price },
        })
      : await db().unitAvailability.updateMany({
          where: {
            unit_id: { in: units.map((u) => u.id) },
            date: dbDate(night),
          },
          data: { price },
        });
  return count > 0;
}

const today = () => toIsoDate(almatyToday(new Date()));

/**
 * Первый домик объекта получает его будущие отметки — чтобы «Свободно»
 * не пропало с сайта, пока владелец не отметит домики по отдельности.
 */
export async function inheritPlaceNights(
  placeId: string,
  unitId: string,
): Promise<void> {
  const rows = await db().availability.findMany({
    where: { place_id: placeId, date: { gte: dbDate(today()) } },
    select: { date: true, status: true, price: true, updated_at: true },
  });
  if (rows.length === 0) return;
  await db().unitAvailability.createMany({
    data: rows.map((r) => ({ unit_id: unitId, ...r })),
    skipDuplicates: true,
  });
}

/** После добавления, удаления домика или смены вместимости — пересчитать будущие ночи. */
export async function resyncFuture(placeId: string): Promise<void> {
  const from = dbDate(today());
  const [placeRows, unitRows] = await Promise.all([
    db().availability.findMany({
      where: { place_id: placeId, date: { gte: from } },
      select: { date: true },
    }),
    db().unitAvailability.findMany({
      where: { unit: { place_id: placeId }, date: { gte: from } },
      select: { date: true },
    }),
  ]);
  const units = await placeUnits(placeId);
  if (units.length === 0) {
    // Домиков больше нет: отметки объекта остаются, места по домикам — нет.
    await db().availability.updateMany({
      where: { place_id: placeId, date: { gte: from } },
      data: { free_capacity: null },
    });
    return;
  }
  const dates = [
    ...new Set([...placeRows, ...unitRows].map((r) => isoDate(r.date))),
  ];
  await syncPlaceNights(placeId, dates);
}

/** Вместимость объекта = сумма мест в домиках (для фильтра «гостей» без дат). */
export async function syncCapacity(placeId: string): Promise<void> {
  const { _sum, _count } = await db().unit.aggregate({
    where: { place_id: placeId },
    _sum: { capacity: true },
    _count: true,
  });
  if (_count > 0)
    await db().place.update({
      where: { id: placeId },
      data: { capacity_max: _sum.capacity },
    });
}
