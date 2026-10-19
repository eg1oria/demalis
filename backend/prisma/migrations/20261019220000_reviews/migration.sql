-- Этап 15: отзывы только от гостей с подтверждённой заявкой.

-- CreateEnum
CREATE TYPE "review_status" AS ENUM ('invited', 'pending', 'published', 'rejected');

-- AlterTable
ALTER TABLE "places" ADD COLUMN     "rating_avg" DECIMAL(2,1),
ADD COLUMN     "review_count" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "reviews" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "place_id" UUID NOT NULL,
    "lead_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "status" "review_status" NOT NULL DEFAULT 'invited',
    "rating" INTEGER,
    "text" TEXT,
    "author_name" TEXT NOT NULL,
    "stay_date" DATE,
    "submitted_at" TIMESTAMPTZ(6),
    "published_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reviews_lead_id_key" ON "reviews"("lead_id");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_token_hash_key" ON "reviews"("token_hash");

-- CreateIndex
CREATE INDEX "reviews_place_id_status_idx" ON "reviews"("place_id", "status");

-- CreateIndex
CREATE INDEX "reviews_status_submitted_at_idx" ON "reviews"("status", "submitted_at");

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Проверки, которых Prisma не умеет описывать.
ALTER TABLE "reviews"
  ADD CONSTRAINT "reviews_rating_check" CHECK ("rating" IS NULL OR "rating" BETWEEN 1 AND 5),
  ADD CONSTRAINT "reviews_submitted_check" CHECK ("status" = 'invited' OR ("rating" IS NOT NULL AND "text" IS NOT NULL));
ALTER TABLE "places"
  ADD CONSTRAINT "places_rating_avg_check" CHECK ("rating_avg" IS NULL OR "rating_avg" BETWEEN 1 AND 5);
