/*
  Warnings:

  - A unique constraint covering the columns `[table_name,fiscal_year,type_id]` on the table `voucher_counter` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "voucher_counter" ADD COLUMN     "type_id" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "voucher_counter_table_name_fiscal_year_type_id_key" ON "voucher_counter"("table_name", "fiscal_year", "type_id");
