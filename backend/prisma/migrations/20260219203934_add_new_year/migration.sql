-- CreateTable
CREATE TABLE "new_year" (
    "fiscal_year" INTEGER NOT NULL,
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "voucher_no" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "debtor_id" INTEGER NOT NULL,
    "amount_taking" DECIMAL(65,30) NOT NULL,
    "creditor_id" INTEGER NOT NULL,
    "amount_pay" DECIMAL(65,30) NOT NULL,
    "currency_id" INTEGER NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "type_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "new_year_pkey" PRIMARY KEY ("fiscal_year","id")
);

-- CreateIndex
CREATE INDEX "new_year_debtor_id_fiscal_year_idx" ON "new_year"("debtor_id", "fiscal_year");

-- CreateIndex
CREATE INDEX "new_year_creditor_id_fiscal_year_idx" ON "new_year"("creditor_id", "fiscal_year");

-- CreateIndex
CREATE INDEX "new_year_fiscal_year_voucher_no_idx" ON "new_year"("fiscal_year", "voucher_no");

-- CreateIndex
CREATE INDEX "new_year_created_at_idx" ON "new_year"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "new_year_fiscal_year_voucher_no_type_id_key" ON "new_year"("fiscal_year", "voucher_no", "type_id");

-- AddForeignKey
ALTER TABLE "new_year" ADD CONSTRAINT "new_year_currency_id_fkey" FOREIGN KEY ("currency_id") REFERENCES "currency"("currency_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "new_year" ADD CONSTRAINT "new_year_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "new_year" ADD CONSTRAINT "new_year_debtor_id_fkey" FOREIGN KEY ("debtor_id") REFERENCES "accounts"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "new_year" ADD CONSTRAINT "new_year_creditor_id_fkey" FOREIGN KEY ("creditor_id") REFERENCES "accounts"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;
