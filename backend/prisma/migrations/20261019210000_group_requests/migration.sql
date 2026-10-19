-- Этап 15: «Подберём за вас» — заявки больших компаний (15+ человек).

-- CreateEnum
CREATE TYPE "group_occasion" AS ENUM ('corporate', 'birthday', 'wedding', 'other');

-- CreateEnum
CREATE TYPE "group_status" AS ENUM ('new', 'in_progress', 'offered', 'won', 'lost');

-- CreateTable
CREATE TABLE "group_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "occasion" "group_occasion" NOT NULL,
    "guests" INTEGER NOT NULL,
    "date_from" DATE,
    "date_to" DATE,
    "budget" INTEGER,
    "direction" "place_direction",
    "amenities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "comment" TEXT,
    "status" "group_status" NOT NULL DEFAULT 'new',
    "admin_note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "group_requests_created_at_idx" ON "group_requests"("created_at");

-- Проверки, которых Prisma не умеет описывать.
ALTER TABLE "group_requests"
  ADD CONSTRAINT "group_requests_guests_check" CHECK ("guests" BETWEEN 15 AND 500),
  ADD CONSTRAINT "group_requests_budget_check" CHECK ("budget" IS NULL OR "budget" >= 0),
  ADD CONSTRAINT "group_requests_dates_check" CHECK ("date_to" IS NULL OR "date_from" IS NULL OR "date_to" > "date_from");
