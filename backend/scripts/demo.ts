/**
 * Демо Этапа 15 поверх тестовых объектов: видео у Pro-объектов.
 * Запуск: npm run demo. Только обновляет и добавляет — ничего не удаляет,
 * повторный запуск ничего не дублирует.
 */
import 'dotenv/config';
import { PlacePlan } from '../src/generated/prisma/client';
import { db, disconnectDb } from '../src/prisma/prisma';
import { dbDate } from '../src/prisma/dates';
import { DEMO_VIDEOS } from './demo-data';

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

async function main() {
  await videos();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => disconnectDb());
