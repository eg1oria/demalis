import { readdir, stat, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { db } from '../prisma/prisma';
import { PHOTO_PATH, uploadsDir } from './photos.service';

/** Свежие файлы не трогаем: фото могли загрузить, но ещё не сохранить объект. */
export const ORPHAN_MIN_AGE_MS = 24 * 60 * 60 * 1000;

type PhotoFile = { path: string; mtimeMs: number };

/**
 * Какие файлы удалить: их нет ни в одном объекте и им больше суток.
 * Если ни у одного объекта нет фото — ничего (похоже на пустую или не ту базу).
 */
export function orphanPhotos(
  files: PhotoFile[],
  used: ReadonlySet<string>,
  now: number,
): string[] {
  if (used.size === 0) return [];
  return files
    .filter(
      (f) =>
        PHOTO_PATH.test(f.path) &&
        !used.has(f.path) &&
        now - f.mtimeMs > ORPHAN_MIN_AGE_MS,
    )
    .map((f) => f.path);
}

/**
 * Ежедневная чистка uploads/places/ от фото, которые загрузили, но не сохранили
 * (или убрали из объекта). Копии остаются в резервных (deploy/backup).
 */
export async function cleanupOrphanPhotos(now: Date): Promise<number> {
  const dir = join(uploadsDir(), 'places');
  let names: string[];
  try {
    names = await readdir(dir);
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return 0;
    throw e;
  }
  const files = await Promise.all(
    names.map(async (name) => ({
      path: `places/${name}`,
      mtimeMs: (await stat(join(dir, name))).mtimeMs,
    })),
  );
  const places = await db().place.findMany({ select: { photos: true } });
  const used = new Set(places.flatMap((p) => p.photos));

  let deleted = 0;
  for (const path of orphanPhotos(files, used, now.getTime())) {
    await unlink(join(uploadsDir(), path));
    deleted++;
  }
  return deleted;
}
