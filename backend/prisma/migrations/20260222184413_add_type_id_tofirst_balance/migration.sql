/*
  Warnings:

  - A unique constraint covering the columns `[fiscal_year,voucher_no,type_id]` on the table `first_balance` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `type` to the `first_balance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type_id` to the `first_balance` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "first_balance_fiscal_year_voucher_no_key";

-- AlterTable
ALTER TABLE "first_balance" ADD COLUMN     "type" TEXT NOT NULL,
ADD COLUMN     "type_id" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "first_balance_fiscal_year_voucher_no_type_id_key" ON "first_balance"("fiscal_year", "voucher_no", "type_id");
