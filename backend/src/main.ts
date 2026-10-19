import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import express from 'express';
import { AppModule } from './app.module';
import {
  PHOTO_EXT,
  PHOTO_MAX_BYTES,
  uploadsDir,
} from './photos/photos.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // За обратным прокси (nginx и т. п.) — IP посетителя из X-Forwarded-For.
  if (process.env.TRUST_PROXY) app.set('trust proxy', process.env.TRUST_PROXY);

  // Браузер ходит в бэкенд только за загрузкой фото из админки.
  const site = process.env.SITE_URL?.replace(/\/$/, '');
  app.enableCors({ origin: site ? [site] : false, methods: ['PUT'] });

  // Импорт CSV — до 1000 строк в одном запросе.
  app.useBodyParser('json', { limit: '5mb' });
  // Фото: тело PUT /uploads/... — сама картинка.
  app.use(
    '/uploads',
    express.raw({ type: Object.keys(PHOTO_EXT), limit: PHOTO_MAX_BYTES + 1 }),
  );
  // Раздача фото: имена — случайные uuid, файлы не меняются.
  app.use(
    '/uploads',
    express.static(uploadsDir(), {
      immutable: true,
      maxAge: '365d',
      index: false,
    }),
  );

  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 4000);
}
void bootstrap();
