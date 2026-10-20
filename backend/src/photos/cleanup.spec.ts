import { describe, expect, it } from '@jest/globals';
import { ORPHAN_MIN_AGE_MS, orphanPhotos } from './cleanup';

const a = 'places/11111111-1111-1111-1111-111111111111.webp';
const b = 'places/22222222-2222-2222-2222-222222222222.jpg';
const c = 'places/33333333-3333-3333-3333-333333333333.webp';
const now = Date.UTC(2026, 9, 20);
const old = now - ORPHAN_MIN_AGE_MS - 1;

describe('orphanPhotos', () => {
  it('удаляет только старые фото, которых нет в объектах', () => {
    const files = [
      { path: a, mtimeMs: old },
      { path: b, mtimeMs: old },
      { path: c, mtimeMs: now - 60_000 },
    ];
    expect(orphanPhotos(files, new Set([a]), now)).toEqual([b]);
  });

  it('чужие файлы в папке не трогает', () => {
    const files = [{ path: 'places/.gitkeep', mtimeMs: old }];
    expect(orphanPhotos(files, new Set([a]), now)).toEqual([]);
  });

  it('ни у одного объекта нет фото — ничего не удаляет', () => {
    expect(orphanPhotos([{ path: b, mtimeMs: old }], new Set(), now)).toEqual(
      [],
    );
  });
});
