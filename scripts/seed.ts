/**
 * Тестовые данные: 12 объектов с пометкой [ТЕСТ] и случайной занятостью на 60 дней.
 * Запуск: npm run seed (берёт ключи из .env.local).
 * Повторный запуск удаляет прошлые [ТЕСТ]-объекты и создаёт заново.
 */
import { createClient } from "@supabase/supabase-js";
import { nextDays } from "../src/lib/dates";
import {
  AVAILABILITY_DAYS,
  type AvailabilityStatus,
} from "../src/lib/places/constants";
import type { PlaceInput } from "../src/lib/places/validate";
import { slugify } from "../src/lib/slug";
import type { Database } from "../src/lib/supabase/database.types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
if (!url || !secret) {
  console.error(
    "Нужны NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SECRET_KEY в .env.local",
  );
  process.exit(1);
}

const supabase = createClient<Database>(url, secret, {
  auth: { persistSession: false },
});

type Seed = Partial<PlaceInput> &
  Pick<
    PlaceInput,
    | "name_ru"
    | "type"
    | "direction"
    | "drive_minutes"
    | "price_from"
    | "capacity_max"
  >;

// Удобства и параметры заданы вручную, чтобы проверять фильтры предсказуемо.
// Фильтр «чан + до 1 ч + 6 гостей» (Этап 2) должен найти только №5, №7 и №8.
// prettier-ignore
const PLACES: Seed[] = [
  { name_ru: "Глэмпинг «Горный воздух»", type: "glamping", direction: "gory_almaty", drive_minutes: 45, price_from: 45000, capacity_max: 4, has_chan: true, has_wifi: true, lat: 43.1702, lng: 77.0514 },
  { name_ru: "A-frame у реки", type: "aframe", direction: "talgar", drive_minutes: 55, price_from: 38000, capacity_max: 4, has_chan: true, has_bbq: true, lat: 43.2586, lng: 77.2401 },
  { name_ru: "Дом с баней «Тургень»", type: "house", direction: "issyk_turgen", drive_minutes: 70, price_from: 60000, capacity_max: 10, has_banya: true, has_chan: true, has_kitchen: true, lat: 43.3978, lng: 77.5956 },
  { name_ru: "Зона отдыха «Капшагай Бич»", type: "zona_otdyha", direction: "kapshagay", drive_minutes: 80, price_from: 8000, price_unit: "per_person", capacity_max: 20, has_pool: true, has_bbq: true, pets_allowed: true, lat: 43.8756, lng: 77.0674 },
  { name_ru: "Банный комплекс «Каскелен»", type: "banya_complex", direction: "kaskelen", drive_minutes: 35, price_from: 30000, capacity_max: 8, has_banya: true, has_chan: true, winter_ok: true, lat: 43.2003, lng: 76.6205 },
  { name_ru: "Гостевой дом «Кольсай»", type: "guesthouse", direction: "charyn_kolsai", drive_minutes: 240, price_from: 20000, capacity_max: 12, has_kitchen: true, pets_allowed: true, lat: 42.9357, lng: 78.3256 },
  { name_ru: "Шале в горах", type: "house", direction: "gory_almaty", drive_minutes: 40, price_from: 80000, capacity_max: 6, has_banya: true, has_chan: true, winter_ok: true, has_wifi: true, lat: 43.1526, lng: 76.9531 },
  { name_ru: "Юрта-глэмпинг «Талгар»", type: "glamping", direction: "talgar", drive_minutes: 60, price_from: 35000, capacity_max: 6, has_chan: true, pets_allowed: true, lat: 43.2361, lng: 77.3314 },
  { name_ru: "A-frame «Сосны»", type: "aframe", direction: "gory_almaty", drive_minutes: 50, price_from: 42000, capacity_max: 2, has_chan: true, winter_ok: true, lat: 43.1349, lng: 77.0071 },
  { name_ru: "Дом у озера «Капшагай»", type: "house", direction: "kapshagay", drive_minutes: 75, price_from: 55000, capacity_max: 8, has_pool: true, has_bbq: true, has_kitchen: true, lat: 43.9012, lng: 77.1178 },
  { name_ru: "Черновик с чаном", type: "house", direction: "talgar", drive_minutes: 30, price_from: 30000, capacity_max: 6, has_chan: true, status: "draft" },
  { name_ru: "Скрытый дом", type: "house", direction: "kaskelen", drive_minutes: 40, price_from: 25000, capacity_max: 6, status: "hidden" },
];

const DEFAULTS = {
  status: "published",
  price_unit: "per_night_unit",
  has_banya: false,
  has_chan: false,
  has_pool: false,
  pets_allowed: false,
  has_kitchen: false,
  has_bbq: false,
  winter_ok: false,
  has_wifi: false,
  photos_permission: false,
  lat: null,
  lng: null,
} as const;

function randomStatus(): AvailabilityStatus | null {
  const r = Math.random();
  if (r < 0.5) return "free";
  if (r < 0.7) return "limited";
  if (r < 0.9) return "full";
  return null; // нет данных
}

async function main() {
  console.log(`База: ${url}`);

  const { error: deleteError, count } = await supabase
    .from("places")
    .delete({ count: "exact" })
    .like("name_ru", "[ТЕСТ]%");
  if (deleteError) throw deleteError;
  if (count) console.log(`Удалено старых тестовых объектов: ${count}`);

  const rows = PLACES.map((p, i) => {
    const name_ru = `[ТЕСТ] ${p.name_ru}`;
    return {
      // Все поля явно: при вставке массива PostgREST не подставляет default.
      ...DEFAULTS,
      ...p,
      name_ru,
      slug: slugify(name_ru),
      whatsapp_phone: `+7701000${String(i + 1).padStart(4, "0")}`,
      address_text: "Тестовый адрес",
      description_ru: "Тестовый объект для проверки сайта. Не настоящий.",
    };
  });

  const { data: places, error } = await supabase
    .from("places")
    .insert(rows)
    .select("id, name_ru");
  if (error) throw error;

  const days = nextDays(new Date(), AVAILABILITY_DAYS);
  const now = Date.now();
  const availability = places.flatMap((place, i) =>
    days.flatMap((date) => {
      const status = randomStatus();
      if (!status) return [];
      // У «Кольсая» данные устарели (10 дней) — пригодится для правила «Уточняйте наличие».
      const age = i === 5 ? 10 * 24 * 3600 * 1000 : 0;
      return [
        {
          place_id: place.id,
          date,
          status,
          updated_at: new Date(now - age).toISOString(),
        },
      ];
    }),
  );

  const { error: availabilityError } = await supabase
    .from("availability")
    .insert(availability);
  if (availabilityError) throw availabilityError;

  console.log(
    `Создано объектов: ${places.length}, записей занятости: ${availability.length}`,
  );
  for (const place of places) console.log(`  • ${place.name_ru}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
