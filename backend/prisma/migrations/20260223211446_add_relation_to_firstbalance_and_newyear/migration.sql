/*
  Warnings:

  - A unique constraint covering the columns `[firstBalanceId]` on the table `new_year` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "new_year" ADD COLUMN     "firstBalanceId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "new_year_firstBalanceId_key" ON "new_year"("firstBalanceId");

-- AddForeignKey
ALTER TABLE "new_year" ADD CONSTRAINT "new_year_firstBalanceId_fkey" FOREIGN KEY ("firstBalanceId") REFERENCES "first_balance"("id") ON DELETE SET NULL ON UPDATE CASCADE;
