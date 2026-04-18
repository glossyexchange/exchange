-- CreateTable
CREATE TABLE "qaid" (
    "id" SERIAL NOT NULL,
    "voucher_no" INTEGER,
    "fiscal_year" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currency_id" INTEGER NOT NULL,
    "com_sender_id" INTEGER NOT NULL,
    "com_receiver_id" INTEGER NOT NULL,
    "amount_transfer" DECIMAL(65,30) NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "user_id" INTEGER NOT NULL,
    "type_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL,

    CONSTRAINT "qaid_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "qaid_com_sender_id_idx" ON "qaid"("com_sender_id");

-- CreateIndex
CREATE INDEX "qaid_com_receiver_id_idx" ON "qaid"("com_receiver_id");

-- CreateIndex
CREATE INDEX "qaid_currency_id_idx" ON "qaid"("currency_id");

-- CreateIndex
CREATE INDEX "qaid_created_at_idx" ON "qaid"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "qaid_fiscal_year_voucher_no_type_id_key" ON "qaid"("fiscal_year", "voucher_no", "type_id");

-- AddForeignKey
ALTER TABLE "qaid" ADD CONSTRAINT "qaid_com_sender_id_fkey" FOREIGN KEY ("com_sender_id") REFERENCES "accounts"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qaid" ADD CONSTRAINT "qaid_com_receiver_id_fkey" FOREIGN KEY ("com_receiver_id") REFERENCES "accounts"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qaid" ADD CONSTRAINT "qaid_currency_id_fkey" FOREIGN KEY ("currency_id") REFERENCES "currency"("currency_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qaid" ADD CONSTRAINT "qaid_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
