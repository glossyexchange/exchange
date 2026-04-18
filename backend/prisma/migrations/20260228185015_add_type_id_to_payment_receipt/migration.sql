-- 1. Add the columns as nullable (temporarily)
ALTER TABLE "payment" ADD COLUMN "type_id" INTEGER;
ALTER TABLE "receipt" ADD COLUMN "type_id" INTEGER;

-- 2. Update existing rows with appropriate values
-- Replace 1 with the actual type ID you want for the existing row(s)
UPDATE "payment" SET "type_id" = 3 WHERE "type_id" IS NULL;
UPDATE "receipt" SET "type_id" = 2 WHERE "type_id" IS NULL;

-- 3. Now make the columns required
ALTER TABLE "payment" ALTER COLUMN "type_id" SET NOT NULL;
ALTER TABLE "receipt" ALTER COLUMN "type_id" SET NOT NULL;
