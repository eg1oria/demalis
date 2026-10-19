-- Этап 14: цены по дням, домики внутри объекта и их занятость.

-- AlterTable
ALTER TABLE "availability" ADD COLUMN     "free_capacity" INTEGER;

-- AlterTable
ALTER TABLE "places" ADD COLUMN     "price_holiday" INTEGER,
ADD COLUMN     "price_weekday" INTEGER,
ADD COLUMN     "price_weekend" INTEGER;

-- CreateTable
CREATE TABLE "units" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "place_id" UUID NOT NULL,
    "name_ru" TEXT NOT NULL,
    "name_kk" TEXT,
    "capacity" INTEGER NOT NULL,
    "price_weekday" INTEGER,
    "price_weekend" INTEGER,
    "price_holiday" INTEGER,
    "sort_order" INTEGER NOT NULL DEFAULT 100,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unit_availability" (
    "unit_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "status" "availability_status" NOT NULL,
    "price" INTEGER,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "unit_availability_pkey" PRIMARY KEY ("unit_id","date")
);

-- CreateIndex
CREATE INDEX "units_place_id_idx" ON "units"("place_id");

-- CreateIndex
CREATE INDEX "unit_availability_date_idx" ON "unit_availability"("date");

-- AddForeignKey
ALTER TABLE "units" ADD CONSTRAINT "units_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit_availability" ADD CONSTRAINT "unit_availability_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Проверки, которых Prisma не описывает.
ALTER TABLE "places" ADD CONSTRAINT "places_day_prices_check" CHECK (
  ("price_weekday" IS NULL OR "price_weekday" >= 0) AND
  ("price_weekend" IS NULL OR "price_weekend" >= 0) AND
  ("price_holiday" IS NULL OR "price_holiday" >= 0));
ALTER TABLE "units" ADD CONSTRAINT "units_capacity_check" CHECK ("capacity" BETWEEN 1 AND 100);
ALTER TABLE "units" ADD CONSTRAINT "units_prices_check" CHECK (
  ("price_weekday" IS NULL OR "price_weekday" >= 0) AND
  ("price_weekend" IS NULL OR "price_weekend" >= 0) AND
  ("price_holiday" IS NULL OR "price_holiday" >= 0));
ALTER TABLE "unit_availability" ADD CONSTRAINT "unit_availability_price_check" CHECK ("price" IS NULL OR ("price" >= 1000 AND "price" <= 5000000));
