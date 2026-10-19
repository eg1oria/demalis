/**
 * Одноразовый перенос данных из локального Supabase в новую базу.
 * Запуск (Supabase ещё запущен): npm run import:supabase
 * Источник — SUPABASE_DB_URL (по умолчанию локальный Supabase), фото — SUPABASE_URL.
 * Таблицы в новой базе очищаются и заполняются заново с теми же id.
 */
import 'dotenv/config';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import pg from 'pg';

const SOURCE =
  process.env.SUPABASE_DB_URL ??
  'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
const STORAGE = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321';
const TARGET = process.env.DATABASE_URL;
const UPLOADS = resolve(
  process.env.UPLOADS_DIR || join(process.cwd(), 'uploads'),
);

// Порядок важен: сначала те, на кого ссылаются.
const TABLES = [
  'owners',
  'places',
  'availability',
  'leads',
  'events',
  'collections',
  'payments',
];

// Даты без времени — строкой, чтобы не сдвинуть их часовым поясом.
pg.types.setTypeParser(1082, (value) => value);

async function main() {
  if (!TARGET) throw new Error('Нет DATABASE_URL в backend/.env');
  const source = new pg.Client({ connectionString: SOURCE });
  const target = new pg.Client({ connectionString: TARGET });
  await source.connect();
  await target.connect();

  await target.query('begin');
  await target.query(`truncate ${[...TABLES].reverse().join(', ')} cascade`);
  for (const table of TABLES) {
    const { rows } = await source.query(`select * from public.${table}`);
    for (const row of rows) {
      const columns = Object.keys(row);
      const values = columns.map((c) => row[c]);
      const overriding = table === 'events' ? ' overriding system value' : '';
      await target.query(
        `insert into ${table} (${columns.map((c) => `"${c}"`).join(', ')})${overriding} values (${columns.map((_, i) => `$${i + 1}`).join(', ')})`,
        values,
      );
    }
    console.log(`${table}: ${rows.length}`);
  }
  await target.query(
    `select setval(pg_get_serial_sequence('events', 'id'), coalesce((select max(id) from events), 0) + 1, false)`,
  );
  await target.query('commit');

  const { rows: places } = await target.query<{ photos: string[] }>(
    'select photos from places',
  );
  const paths = [...new Set(places.flatMap((p) => p.photos))];
  let copied = 0;
  for (const path of paths) {
    const res = await fetch(
      `${STORAGE}/storage/v1/object/public/place-photos/${path}`,
    );
    if (!res.ok) {
      console.warn(`фото не найдено: ${path} (${res.status})`);
      continue;
    }
    const file = join(UPLOADS, path);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, Buffer.from(await res.arrayBuffer()));
    copied++;
  }
  console.log(`фото: ${copied} из ${paths.length} → ${UPLOADS}`);

  await source.end();
  await target.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
