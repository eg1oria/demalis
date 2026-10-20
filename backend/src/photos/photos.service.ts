import { mkdir, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import sharp from 'sharp';

/**
 * Путь фото внутри uploads/ — так же он хранится в places.photos.
 * Новые фото всегда .webp; jpg и png — загруженные до Этапа 16.
 */
export const PHOTO_PATH = /^places\/[0-9a-f-]{36}\.(jpg|png|webp)$/;

export const PHOTO_MAX_BYTES = 10 * 1024 * 1024;

/** Какие картинки можно загрузить (всё равно сохраняются как WebP). */
export const PHOTO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/** Длинная сторона сохранённого фото: с запасом для экрана 2x. */
export const PHOTO_MAX_SIDE = 2000;

/**
 * Уменьшает фото и переводит в WebP: поворот по EXIF, не больше
 * PHOTO_MAX_SIDE по длинной стороне. Метаданные (в т. ч. GPS) не сохраняются.
 * null — не картинка или битый файл.
 */
export async function compressPhoto(input: Buffer): Promise<Buffer | null> {
  try {
    return await sharp(input, { limitInputPixels: 100_000_000 })
      .rotate()
      .resize(PHOTO_MAX_SIDE, PHOTO_MAX_SIDE, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 80 })
      .toBuffer();
  } catch {
    return null;
  }
}

/** Папка с загруженными файлами (UPLOADS_DIR или backend/uploads). */
export function uploadsDir(): string {
  return resolve(process.env.UPLOADS_DIR || join(process.cwd(), 'uploads'));
}

type UploadClaim = { path: string; purpose: 'photo-upload' };

/**
 * Загрузка фото прямо из браузера: админка получает одноразовую подписанную
 * ссылку (10 минут на один конкретный путь) и отправляет файл PUT-запросом.
 */
@Injectable()
export class PhotosService {
  constructor(private readonly jwt: JwtService) {}

  createUpload(
    contentType: string,
  ): { path: string; token: string } | { error: string } {
    if (!PHOTO_EXT[contentType])
      return { error: 'Можно загружать только JPG, PNG или WebP' };
    const path = `places/${randomUUID()}.webp`;
    const token = this.jwt.sign(
      { path, purpose: 'photo-upload' } satisfies UploadClaim,
      {
        expiresIn: '10m',
      },
    );
    return { path, token };
  }

  /** Проверяет ссылку и сохраняет файл. Ошибка — текст для админки. */
  async save(
    path: string,
    token: string | undefined,
    contentType: string | undefined,
    body: unknown,
  ): Promise<string | null> {
    let claim: UploadClaim;
    try {
      claim = this.jwt.verify<UploadClaim>(token ?? '');
    } catch {
      return 'Ссылка для загрузки устарела — попробуйте ещё раз';
    }
    if (
      claim.purpose !== 'photo-upload' ||
      claim.path !== path ||
      !PHOTO_PATH.test(path)
    )
      return 'Неверная ссылка для загрузки';
    if (!contentType || !PHOTO_EXT[contentType.split(';')[0].trim()])
      return 'Можно загружать только JPG, PNG или WebP';
    if (!Buffer.isBuffer(body) || body.length === 0) return 'Пустой файл';
    if (body.length > PHOTO_MAX_BYTES) return 'Файл больше 10 МБ';
    const photo = await compressPhoto(body);
    if (!photo) return 'Не удалось прочитать фото — попробуйте другой файл';

    const file = join(uploadsDir(), path);
    await mkdir(dirname(file), { recursive: true });
    // flag "wx": один путь — один файл, перезаписать чужое фото нельзя.
    try {
      await writeFile(file, photo, { flag: 'wx' });
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'EEXIST')
        return 'Файл уже загружен';
      throw e;
    }
    return null;
  }
}
