/**
 * Демо Этапа 15 поверх тестовых объектов: видео у Pro-объектов,
 * опубликованные отзывы и одна ссылка на отзыв для проверки формы.
 * Запуск: npm run demo. Только обновляет и добавляет — ничего не удаляет,
 * повторный запуск ничего не дублирует.
 */
import 'dotenv/config';
import { PlacePlan } from '../src/generated/prisma/client';
import { db, disconnectDb } from '../src/prisma/prisma';
import { refreshPlaceRating, newReviewToken } from '../src/common/reviews';
import { dbDate } from '../src/prisma/dates';
import { DEMO_INVITE, DEMO_REVIEWS, DEMO_VIDEOS } from './demo-data';

/** Метка демо-заявок: по ней повторный запуск находит уже созданное. */
const MARK = '[ТЕСТ] демо-отзыв';

const inDays = (days: number) =>
  new Date(Date.now() + days * 864e5).toISOString().slice(0, 10);

async function videos() {
  const prisma = db();
  for (const [slug, video_url] of Object.entries(DEMO_VIDEOS)) {
    const { count } = await prisma.place.updateMany({
      where: { slug },
      data: {
        video_url,
        plan: PlacePlan.pro,
        pro_until: dbDate(inDays(90)),
      },
    });
    console.log(`${count ? '✓' : '— нет объекта'} ${slug}: ${video_url}`);
  }
}

/** Подтверждённая прошедшая заявка (две ночи); есть — возвращает её. */
async function demoLead(slug: string, name: string, daysAgo: number) {
  const prisma = db();
  const place = await prisma.place.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!place) return null;
  const existing = await prisma.lead.findFirst({
    where: { place_id: place.id, name, comment: MARK },
    select: { id: true, place_id: true, name: true, date_from: true },
  });
  if (existing) return existing;
  return prisma.lead.create({
    data: {
      place_id: place.id,
      name,
      phone: '+77010009999',
      date_from: dbDate(inDays(-daysAgo)),
      date_to: dbDate(inDays(-daysAgo + 2)),
      guests: 2,
      comment: MARK,
      status: 'confirmed',
      created_at: new Date(Date.now() - (daysAgo + 7) * 864e5),
    },
    select: { id: true, place_id: true, name: true, date_from: true },
  });
}

async function reviews() {
  const prisma = db();
  const places = new Set<string>();
  for (const r of DEMO_REVIEWS) {
    const lead = await demoLead(r.slug, r.name, r.daysAgo);
    if (!lead) continue;
    const published_at = new Date(Date.now() - (r.daysAgo - 3) * 864e5);
    await prisma.review.upsert({
      where: { lead_id: lead.id },
      create: {
        lead_id: lead.id,
        place_id: lead.place_id,
        token_hash: newReviewToken().hash,
        author_name: r.name,
        stay_date: lead.date_from,
        status: 'published',
        rating: r.rating,
        text: r.text,
        submitted_at: published_at,
        published_at,
      },
      update: {},
    });
    places.add(lead.place_id);
  }
  for (const id of places) await refreshPlaceRating(prisma, id);
  console.log(`✓ отзывы: ${DEMO_REVIEWS.length} у ${places.size} объектов`);

  // Новая ссылка при каждом запуске, пока гость не ответил.
  const lead = await demoLead(
    DEMO_INVITE.slug,
    DEMO_INVITE.name,
    DEMO_INVITE.daysAgo,
  );
  if (!lead) return;
  const review = await prisma.review.findUnique({
    where: { lead_id: lead.id },
    select: { status: true },
  });
  if (review && review.status !== 'invited') {
    console.log('— демо-ссылка уже использована, отзыв ждёт проверки');
    return;
  }
  const { token, hash } = newReviewToken();
  await prisma.review.upsert({
    where: { lead_id: lead.id },
    create: {
      lead_id: lead.id,
      place_id: lead.place_id,
      token_hash: hash,
      author_name: lead.name,
      stay_date: lead.date_from,
    },
    update: { token_hash: hash },
  });
  const site = (process.env.SITE_URL || 'http://localhost:3000').replace(
    /\/$/,
    '',
  );
  console.log(`✓ ссылка на отзыв: ${site}/ru/review/${token}`);
}

async function main() {
  await videos();
  await reviews();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => disconnectDb());
