-- CreateEnum
CREATE TYPE "place_type" AS ENUM ('glamping', 'aframe', 'house', 'zona_otdyha', 'banya_complex', 'guesthouse');

-- CreateEnum
CREATE TYPE "place_direction" AS ENUM ('gory_almaty', 'talgar', 'issyk_turgen', 'kaskelen', 'kapshagay', 'charyn_kolsai', 'drugoe');

-- CreateEnum
CREATE TYPE "price_unit" AS ENUM ('per_night_unit', 'per_person');

-- CreateEnum
CREATE TYPE "place_status" AS ENUM ('draft', 'published', 'hidden');

-- CreateEnum
CREATE TYPE "place_plan" AS ENUM ('free', 'pro');

-- CreateEnum
CREATE TYPE "availability_status" AS ENUM ('free', 'limited', 'full');

-- CreateEnum
CREATE TYPE "lead_status" AS ENUM ('new', 'sent_to_owner', 'confirmed', 'cancelled', 'no_answer');

-- CreateEnum
CREATE TYPE "event_type" AS ENUM ('view', 'whatsapp_click', 'phone_click', 'instagram_click');

-- CreateEnum
CREATE TYPE "payment_kind" AS ENUM ('pro', 'promotion', 'video', 'leads', 'other');

-- CreateTable
CREATE TABLE "owners" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "telegram_chat_id" BIGINT,
    "link_code" TEXT,
    "language" TEXT,
    "last_report_month" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "owners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "places" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "name_ru" TEXT NOT NULL,
    "name_kk" TEXT,
    "type" "place_type" NOT NULL,
    "direction" "place_direction" NOT NULL,
    "address_text" TEXT,
    "lat" DECIMAL(9,6),
    "lng" DECIMAL(9,6),
    "drive_minutes" INTEGER,
    "price_from" INTEGER,
    "price_unit" "price_unit" NOT NULL DEFAULT 'per_night_unit',
    "capacity_max" INTEGER,
    "has_banya" BOOLEAN NOT NULL DEFAULT false,
    "has_chan" BOOLEAN NOT NULL DEFAULT false,
    "has_pool" BOOLEAN NOT NULL DEFAULT false,
    "pets_allowed" BOOLEAN NOT NULL DEFAULT false,
    "has_kitchen" BOOLEAN NOT NULL DEFAULT false,
    "has_bbq" BOOLEAN NOT NULL DEFAULT false,
    "winter_ok" BOOLEAN NOT NULL DEFAULT false,
    "has_wifi" BOOLEAN NOT NULL DEFAULT false,
    "description_ru" TEXT,
    "description_kk" TEXT,
    "whatsapp_phone" TEXT NOT NULL,
    "instagram_url" TEXT,
    "photos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "video_url" TEXT,
    "status" "place_status" NOT NULL DEFAULT 'draft',
    "plan" "place_plan" NOT NULL DEFAULT 'free',
    "featured_until" DATE,
    "pro_until" DATE,
    "pro_reminded_for" DATE,
    "owner_id" UUID,
    "photos_permission" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "places_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "availability" (
    "place_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "status" "availability_status" NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "availability_pkey" PRIMARY KEY ("place_id","date")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "place_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "date_from" DATE,
    "date_to" DATE,
    "guests" INTEGER,
    "comment" TEXT,
    "status" "lead_status" NOT NULL DEFAULT 'new',
    "billable" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" BIGSERIAL NOT NULL,
    "place_id" UUID NOT NULL,
    "type" "event_type" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_rate_limits" (
    "id" BIGSERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_rate_limits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collections" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "title_ru" TEXT NOT NULL,
    "title_kk" TEXT,
    "intro_ru" TEXT,
    "intro_kk" TEXT,
    "filters" TEXT NOT NULL DEFAULT '',
    "sort_order" INTEGER NOT NULL DEFAULT 100,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "place_id" UUID NOT NULL,
    "amount" INTEGER NOT NULL,
    "kind" "payment_kind" NOT NULL,
    "paid_at" DATE NOT NULL DEFAULT CURRENT_DATE,
    "comment" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "used_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "owners_telegram_chat_id_key" ON "owners"("telegram_chat_id");

-- CreateIndex
CREATE UNIQUE INDEX "owners_link_code_key" ON "owners"("link_code");

-- CreateIndex
CREATE UNIQUE INDEX "places_slug_key" ON "places"("slug");

-- CreateIndex
CREATE INDEX "places_status_idx" ON "places"("status");

-- CreateIndex
CREATE INDEX "places_owner_id_idx" ON "places"("owner_id");

-- CreateIndex
CREATE INDEX "availability_date_idx" ON "availability"("date");

-- CreateIndex
CREATE INDEX "leads_place_id_created_at_idx" ON "leads"("place_id", "created_at");

-- CreateIndex
CREATE INDEX "leads_created_at_idx" ON "leads"("created_at");

-- CreateIndex
CREATE INDEX "events_place_id_created_at_idx" ON "events"("place_id", "created_at");

-- CreateIndex
CREATE INDEX "events_created_at_idx" ON "events"("created_at");

-- CreateIndex
CREATE INDEX "lead_rate_limits_key_created_at_idx" ON "lead_rate_limits"("key", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "collections_slug_key" ON "collections"("slug");

-- CreateIndex
CREATE INDEX "payments_place_id_paid_at_idx" ON "payments"("place_id", "paid_at");

-- CreateIndex
CREATE INDEX "payments_paid_at_idx" ON "payments"("paid_at");

-- CreateIndex
CREATE UNIQUE INDEX "login_tokens_token_hash_key" ON "login_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "login_tokens_email_created_at_idx" ON "login_tokens"("email", "created_at");

-- AddForeignKey
ALTER TABLE "places" ADD CONSTRAINT "places_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "owners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availability" ADD CONSTRAINT "availability_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── Проверки формата (Prisma их не описывает) ─────────────────────────────
ALTER TABLE "places"
  ADD CONSTRAINT "places_slug_check" CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  ADD CONSTRAINT "places_name_ru_check" CHECK (length(trim(name_ru)) > 0),
  ADD CONSTRAINT "places_lat_check" CHECK (lat BETWEEN -90 AND 90),
  ADD CONSTRAINT "places_lng_check" CHECK (lng BETWEEN -180 AND 180),
  ADD CONSTRAINT "places_drive_minutes_check" CHECK (drive_minutes >= 0),
  ADD CONSTRAINT "places_price_from_check" CHECK (price_from >= 0),
  ADD CONSTRAINT "places_capacity_max_check" CHECK (capacity_max > 0),
  ADD CONSTRAINT "places_whatsapp_phone_check" CHECK (whatsapp_phone ~ '^\+77[0-9]{9}$');

ALTER TABLE "owners"
  ADD CONSTRAINT "owners_link_code_format" CHECK (link_code IS NULL OR link_code ~ '^[A-Z0-9]{6,16}$'),
  ADD CONSTRAINT "owners_language_check" CHECK (language IN ('ru', 'kk')),
  ADD CONSTRAINT "owners_last_report_month_check" CHECK (last_report_month ~ '^\d{4}-\d{2}$');

ALTER TABLE "leads"
  ADD CONSTRAINT "leads_phone_check" CHECK (phone ~ '^\+77[0-9]{9}$'),
  ADD CONSTRAINT "leads_guests_check" CHECK (guests > 0),
  ADD CONSTRAINT "leads_dates_check" CHECK (date_to IS NULL OR date_from IS NULL OR date_to >= date_from);

ALTER TABLE "collections"
  ADD CONSTRAINT "collections_slug_check" CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  ADD CONSTRAINT "collections_title_ru_check" CHECK (length(trim(title_ru)) > 0);

ALTER TABLE "payments"
  ADD CONSTRAINT "payments_amount_check" CHECK (amount > 0);

-- Платные заявки за месяц — отчёт в админке.
CREATE INDEX "leads_billable_created_at_idx" ON "leads" ("created_at") WHERE billable;

-- ── Стартовые 10 подборок. Казахские тексты — TODO: проверить носителю. ──
insert into "collections" (slug, filters, sort_order, title_ru, title_kk, intro_ru, intro_kk) values
('s-chanom', 'chan=1', 10,
  'С чаном', 'Шаны бар',
  'Загородные дома, глэмпинги и базы отдыха у Алматы с горячим чаном на дровах. Смотрите, где свободно на ближайшие выходные, и пишите владельцу напрямую.',
  'Алматы маңындағы отынмен қыздырылатын ыстық шаны бар үйлер, глэмпингтер мен демалыс базалары. Жақын демалыс күндері қай жер бос екенін көріп, иесіне тікелей жазыңыз.'),
('s-banej', 'banya=1', 20,
  'С баней', 'Моншасы бар',
  'Места отдыха вокруг Алматы с баней: дома, банные комплексы и зоны отдыха. Отметки занятости обновляют сами владельцы.',
  'Алматы маңындағы моншасы бар демалыс орындары: үйлер, монша кешендері және демалыс аймақтары. Бос орындарды иелерінің өздері жаңартады.'),
('s-zhivotnymi', 'pets=1', 30,
  'Можно с животными', 'Жануарлармен болады',
  'Куда поехать из Алматы с собакой или кошкой: дома и глэмпинги, где рады питомцам.',
  'Алматыдан итпен немесе мысықпен қайда баруға болады: үй жануарларын қабылдайтын үйлер мен глэмпингтер.'),
('zimoj', 'winter=1', 40,
  'Зимой тепло', 'Қыста жылы',
  'Места, где уютно и тепло зимой: отопление, баня, чан. Загородный отдых у Алматы в холодный сезон.',
  'Қыста жылы әрі жайлы орындар: жылыту, монша, шан. Суық мезгілде Алматы маңындағы демалыс.'),
('do-chasa-ezdy', 'drive=60', 50,
  'До часа езды', 'Бір сағатқа дейінгі жол',
  'Загородный отдых не дальше часа от центра Алматы — можно выехать в субботу утром и не тратить день на дорогу.',
  'Алматы орталығынан бір сағаттан аспайтын жердегі демалыс — сенбі күні таңертең шығып, жолға күн жоғалтпайсыз.'),
('kapshagay', 'dir=kapshagay', 60,
  'Капшагай', 'Қапшағай',
  'Зоны отдыха и дома на Капшагае: вода, пляж и летний отдых в паре часов от Алматы.',
  'Қапшағайдағы демалыс аймақтары мен үйлер: су, жағажай және Алматыдан бірнеше сағаттағы жазғы демалыс.'),
('glempingi', 'type=glamping', 70,
  'Глэмпинги', 'Глэмпингтер',
  'Глэмпинги у Алматы: палатки и купола с кроватями, видом на горы и всем необходимым для комфортного отдыха на природе.',
  'Алматы маңындағы глэмпингтер: төсегі бар шатырлар мен күмбездер, тауға көрініс және табиғаттағы жайлы демалысқа қажеттінің бәрі.'),
('a-frame', 'type=aframe', 80,
  'A-frame домики', 'A-frame үйлері',
  'Треугольные A-frame домики в горах и у реки вокруг Алматы — с панорамными окнами и видом на природу.',
  'Алматы маңындағы таудағы және өзен жағасындағы үшбұрышты A-frame үйлері — панорамалық терезелері мен табиғатқа көрінісі бар.'),
('dlya-bolshoj-kompanii', 'guests=10', 90,
  'Для большой компании', 'Үлкен топқа',
  'Где отдохнуть компанией от 10 человек у Алматы: большие дома, базы и зоны отдыха.',
  'Алматы маңында 10 адамнан тұратын топпен қайда демалуға болады: үлкен үйлер, базалар және демалыс аймақтары.'),
('nedorogo', 'price=30&sort=price', 100,
  'Недорого — до 30 тысяч', 'Арзан — 30 мыңға дейін',
  'Загородный отдых у Алматы до 30 000 ₸ за ночь. Сначала самые доступные варианты.',
  'Алматы маңындағы түнімен 30 000 ₸-ге дейінгі демалыс. Алдымен ең қолжетімді нұсқалар.');
