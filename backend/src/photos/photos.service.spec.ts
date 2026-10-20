import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { JwtService } from '@nestjs/jwt';
import sharp from 'sharp';
import { compressPhoto, PHOTO_MAX_SIDE, PhotosService } from './photos.service';

const jpeg = (width: number, height: number) =>
  sharp({
    create: { width, height, channels: 3, background: '#4a7' },
  })
    .jpeg()
    .withMetadata({ exif: { IFD0: { Copyright: 'test' } } })
    .toBuffer();

describe('compressPhoto', () => {
  it('большое фото → WebP не больше PHOTO_MAX_SIDE, без EXIF', async () => {
    const out = await compressPhoto(await jpeg(4000, 3000));
    const meta = await sharp(out!).metadata();
    expect(meta.format).toBe('webp');
    expect(meta.width).toBe(PHOTO_MAX_SIDE);
    expect(meta.height).toBe(1500);
    expect(meta.exif).toBeUndefined();
  });

  it('маленькое фото не увеличивается', async () => {
    const meta = await sharp(
      (await compressPhoto(await jpeg(800, 600)))!,
    ).metadata();
    expect([meta.width, meta.height]).toEqual([800, 600]);
  });

  it('не картинка → null', async () => {
    expect(await compressPhoto(Buffer.from('not an image'))).toBeNull();
  });
});

describe('PhotosService', () => {
  const service = new PhotosService(new JwtService({ secret: 'test' }));
  let dir: string;

  beforeAll(async () => {
    dir = await mkdtemp(join(tmpdir(), 'demalis-photos-'));
    process.env.UPLOADS_DIR = dir;
  });
  afterAll(async () => {
    delete process.env.UPLOADS_DIR;
    await rm(dir, { recursive: true, force: true });
  });

  const upload = (contentType: string) => {
    const result = service.createUpload(contentType);
    if ('error' in result) throw new Error(result.error);
    return result;
  };

  it('путь всегда .webp, даже для JPG', () => {
    expect(upload('image/jpeg').path).toMatch(/^places\/[0-9a-f-]{36}\.webp$/);
    expect(service.createUpload('image/gif')).toEqual({
      error: 'Можно загружать только JPG, PNG или WebP',
    });
  });

  it('сохраняет JPG как WebP', async () => {
    const { path, token } = upload('image/jpeg');
    const error = await service.save(
      path,
      token,
      'image/jpeg',
      await jpeg(3000, 3000),
    );
    expect(error).toBeNull();
    const meta = await sharp(await readFile(join(dir, path))).metadata();
    expect(meta.format).toBe('webp');
    expect(meta.width).toBe(PHOTO_MAX_SIDE);
  });

  it('чужой путь, неверный тип и битый файл — ошибка', async () => {
    const { path, token } = upload('image/png');
    const other = upload('image/png').path;
    const body = await jpeg(10, 10);
    expect(await service.save(other, token, 'image/png', body)).toBe(
      'Неверная ссылка для загрузки',
    );
    expect(await service.save(path, 'bad', 'image/png', body)).toMatch(
      /устарела/,
    );
    expect(await service.save(path, token, 'image/gif', body)).toMatch(
      /только JPG/,
    );
    expect(
      await service.save(path, token, 'image/png', Buffer.from('x')),
    ).toMatch(/Не удалось прочитать/);
  });
});
