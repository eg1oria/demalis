import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

// Нужна запущенная база (docker compose up -d) и backend/.env.
describe('API (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/health — бэкенд видит базу', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({ ok: true });
  });

  it('/admin/* без входа — 401', () => {
    return request(app.getHttpServer()).get('/admin/places').expect(401);
  });

  it('/public/collections — только опубликованные', async () => {
    const res = await request(app.getHttpServer())
      .get('/public/collections')
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    for (const c of res.body as { published: boolean }[])
      expect(c.published).toBe(true);
  });

  afterAll(async () => {
    await app.close();
  });
});
