import { mkdir, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

/** Путь фото внутри uploads/ — так же он хранится в places.photos. */
export const PHOTO_PATH = /^places\/[0-9a-f-]{36}\.(jpg|png|webp)$/;

export const PHOTO_MAX_BYTES = 10 * 1024 * 1024;

export const PHOTO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

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
    const ext = PHOTO_EXT[contentType];
    if (!ext) return { error: 'Можно загружать только JPG, PNG или WebP' };
    const path = `places/${randomUUID()}.${ext}`;
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
    if (
      !contentType ||
      PHOTO_EXT[contentType.split(';')[0]] !== path.split('.').pop()
    )
      return 'Тип файла не совпадает с выбранным';
    if (!Buffer.isBuffer(body) || body.length === 0) return 'Пустой файл';
    if (body.length > PHOTO_MAX_BYTES) return 'Файл больше 10 МБ';

    const file = join(uploadsDir(), path);
    await mkdir(dirname(file), { recursive: true });
    // flag "wx": один путь — один файл, перезаписать чужое фото нельзя.
    try {
      await writeFile(file, body, { flag: 'wx' });
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'EEXIST')
        return 'Файл уже загружен';
      throw e;
    }
    return null;
  }
}
