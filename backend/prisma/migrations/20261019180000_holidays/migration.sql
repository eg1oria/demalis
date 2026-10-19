-- Праздники (Этап 13): цена за конкретную ночь, подборка на одну ночь,
-- ожидание ответа владельца в боте, праздничное продвижение.

-- AlterEnum
ALTER TYPE "payment_kind" ADD VALUE 'promotion_holiday' AFTER 'promotion';

-- AlterTable
ALTER TABLE "owners" ADD COLUMN "awaiting_input" TEXT;

-- AlterTable
ALTER TABLE "availability" ADD COLUMN "price" INTEGER;
ALTER TABLE "availability" ADD CONSTRAINT "availability_price_check" CHECK ("price" IS NULL OR ("price" >= 1000 AND "price" <= 5000000));

-- AlterTable
ALTER TABLE "collections" ADD COLUMN "night" DATE;

-- Новогодняя подборка: первой на главной. Казахский текст — TODO: проверить носителю.
insert into "collections" (slug, filters, sort_order, night, title_ru, title_kk, intro_ru, intro_kk) values
('novyj-god', 'winter=1', 1, '2026-12-31',
  'Новый год за городом', 'Жаңа жыл қала сыртында',
  'Где встретить Новый год у Алматы: дома с баней и чаном, глэмпинги и A-frame, где тепло зимой. Свободные места и цены на ночь 31 декабря отмечают сами владельцы — пишите напрямую, пока есть места.',
  'Жаңа жылды Алматы маңында қайда қарсы алуға болады: моншасы мен шаны бар үйлер, қыста жылы глэмпингтер мен A-frame үйлер. 31 желтоқсан түнгі бос орындар мен бағаларды иелерінің өздері белгілейді — орын барда тікелей жазыңыз.')
on conflict (slug) do nothing;
