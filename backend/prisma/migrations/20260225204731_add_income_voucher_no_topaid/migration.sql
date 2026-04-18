-- Add the column as nullable first
ALTER TABLE "paid_transfer" ADD COLUMN "income_voucher_no" INTEGER;

-- Backfill existing rows with the current voucher_no (or a sensible default)
UPDATE "paid_transfer" SET "income_voucher_no" = "voucher_no" WHERE "income_voucher_no" IS NULL;

-- Now make it NOT NULL
ALTER TABLE "paid_transfer" ALTER COLUMN "income_voucher_no" SET NOT NULL;