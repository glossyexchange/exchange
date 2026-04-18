-- AddForeignKey
ALTER TABLE "movement" ADD CONSTRAINT "movement_debtor_id_fkey" FOREIGN KEY ("debtor_id") REFERENCES "accounts"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movement" ADD CONSTRAINT "movement_creditor_id_fkey" FOREIGN KEY ("creditor_id") REFERENCES "accounts"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;
