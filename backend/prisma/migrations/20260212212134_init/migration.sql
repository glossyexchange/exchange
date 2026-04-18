-- CreateEnum
CREATE TYPE "CurrencyAction" AS ENUM ('MULTIPLY', 'DIVIDE');

-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('CASH', 'INSTALLMENT');

-- CreateTable
CREATE TABLE "information" (
    "id" SERIAL NOT NULL,
    "enName" TEXT,
    "krName" TEXT,
    "arName" TEXT,
    "enJob" TEXT,
    "krJob" TEXT,
    "arJob" TEXT,
    "enAddress" TEXT,
    "krAddress" TEXT,
    "arAddress" TEXT,
    "phoneOne" TEXT,
    "phoneTwo" TEXT,
    "phoneThree" TEXT,
    "logo" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "information_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admins" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "image" TEXT,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tokenVersion" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "notification_status" TEXT NOT NULL DEFAULT 'unseen',
    "note" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "admin_id" INTEGER NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_types" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" SERIAL NOT NULL,
    "account_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "account_type_id" INTEGER NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "address" (
    "id" SERIAL NOT NULL,
    "country" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "place" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paid_transfer_address" (
    "id" SERIAL NOT NULL,
    "company_name" TEXT,
    "person_name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "paid_transfer_address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "Name" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'inactive',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sub_categories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "category_id" INTEGER NOT NULL,

    CONSTRAINT "sub_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "currency" (
    "id" SERIAL NOT NULL,
    "currency_id" INTEGER NOT NULL,
    "currency_symbol" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "currency_price" DECIMAL(65,30) DEFAULT 0,
    "currency_action" "CurrencyAction" NOT NULL DEFAULT 'MULTIPLY',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "currency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_type" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expense_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voucher_counter" (
    "id" SERIAL NOT NULL,
    "table_name" TEXT NOT NULL,
    "fiscal_year" INTEGER NOT NULL,
    "next_voucher" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "voucher_counter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "send_transfer" (
    "id" SERIAL NOT NULL,
    "voucher_no" INTEGER,
    "fiscal_year" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currency_id" INTEGER NOT NULL,
    "com_sender_id" INTEGER NOT NULL,
    "hmula_from_com_sender" DECIMAL(65,30),
    "com_receiver_id" INTEGER NOT NULL,
    "hmula_from_com_receiver" DECIMAL(65,30),
    "hmula_to_com_receiver" DECIMAL(65,30),
    "receiver_person" TEXT,
    "receiver_address" TEXT,
    "receiver_phone" TEXT,
    "sender_person" TEXT,
    "sender_address" TEXT,
    "sender_phone" TEXT,
    "amount_transfer" DECIMAL(65,30) NOT NULL,
    "hmula_to_com_sender" DECIMAL(65,30),
    "total_transfer_to_receiver" DECIMAL(65,30) NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "user_id" INTEGER NOT NULL,
    "address_id" INTEGER,
    "transfer_type_id" INTEGER NOT NULL,
    "hmula_id" INTEGER NOT NULL,
    "type_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "currency_type" TEXT NOT NULL,

    CONSTRAINT "send_transfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "income_transfer" (
    "id" SERIAL NOT NULL,
    "voucher_no" INTEGER,
    "fiscal_year" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currency_id" INTEGER NOT NULL,
    "com_sender_id" INTEGER NOT NULL,
    "hmula_from_com_sender" DECIMAL(65,30),
    "hmula_to_com_sender" DECIMAL(65,30),
    "receiver_person" TEXT,
    "receiver_address" TEXT,
    "receiver_phone" TEXT,
    "sender_person" TEXT,
    "sender_address" TEXT,
    "sender_phone" TEXT,
    "amount_transfer" DECIMAL(65,30) NOT NULL,
    "hmula_from_receiver" DECIMAL(65,30),
    "total_transfer_to_receiver" DECIMAL(65,30) NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "user_id" INTEGER NOT NULL,
    "paid_id" INTEGER NOT NULL DEFAULT 0,
    "hawala_incom_id" INTEGER NOT NULL,
    "hmula_id" INTEGER NOT NULL,
    "type_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "currency_type" TEXT NOT NULL,

    CONSTRAINT "income_transfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cancelled_income_transfer" (
    "id" SERIAL NOT NULL,
    "voucher_no" INTEGER NOT NULL,
    "fiscal_year" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currency_id" INTEGER NOT NULL,
    "com_sender_id" INTEGER NOT NULL,
    "hmula_from_com_sender" DECIMAL(65,30),
    "hmula_to_com_sender" DECIMAL(65,30),
    "receiver_person" TEXT,
    "receiver_address" TEXT,
    "receiver_phone" TEXT,
    "sender_person" TEXT,
    "sender_address" TEXT,
    "sender_phone" TEXT,
    "amount_transfer" DECIMAL(65,30) NOT NULL,
    "hmula_from_receiver" DECIMAL(65,30),
    "total_transfer_to_receiver" DECIMAL(65,30) NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "cancelled_income_transfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paid_transfer" (
    "id" SERIAL NOT NULL,
    "voucher_no" INTEGER NOT NULL,
    "fiscal_year" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currency_id" INTEGER NOT NULL,
    "com_sender_id" INTEGER NOT NULL,
    "hmula_from_com_sender" DECIMAL(65,30),
    "hmula_to_com_sender" DECIMAL(65,30),
    "receiver_person" TEXT,
    "receiver_address" TEXT,
    "receiver_phone" TEXT,
    "sender_person" TEXT,
    "sender_address" TEXT,
    "sender_phone" TEXT,
    "amount_transfer" DECIMAL(65,30) NOT NULL,
    "hmula_from_receiver" DECIMAL(65,30),
    "total_transfer_to_receiver" DECIMAL(65,30) NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "user_id" INTEGER NOT NULL,
    "paid_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paid_transfer_address_id" INTEGER NOT NULL,
    "account_id" INTEGER NOT NULL,
    "hawala_incom_id" INTEGER NOT NULL,
    "type_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "currency_type" TEXT NOT NULL,

    CONSTRAINT "paid_transfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cancelled_send_transfer" (
    "id" SERIAL NOT NULL,
    "voucher_no" INTEGER NOT NULL,
    "fiscal_year" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currency_id" INTEGER NOT NULL,
    "com_sender_id" INTEGER NOT NULL,
    "hmula_from_com_sender" DECIMAL(65,30),
    "com_receiver_id" INTEGER NOT NULL,
    "hmula_from_com_receiver" DECIMAL(65,30),
    "hmula_to_com_receiver" DECIMAL(65,30),
    "receiver_person" TEXT,
    "receiver_address" TEXT,
    "receiver_phone" TEXT,
    "sender_person" TEXT,
    "sender_address" TEXT,
    "sender_phone" TEXT,
    "amount_transfer" DECIMAL(65,30) NOT NULL,
    "hmula_to_com_sender" DECIMAL(65,30),
    "total_transfer_to_receiver" DECIMAL(65,30) NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "user_id" INTEGER NOT NULL,
    "address_id" INTEGER,
    "transfer_type_id" INTEGER NOT NULL,

    CONSTRAINT "cancelled_send_transfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exchange_usd" (
    "id" SERIAL NOT NULL,
    "voucher_no" INTEGER,
    "fiscal_year" INTEGER,
    "exchange_type_id" INTEGER NOT NULL,
    "exchange_type" TEXT NOT NULL,
    "account_id" INTEGER NOT NULL,
    "amount_usd" DECIMAL(65,30) NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "amount_iqd" DECIMAL(65,30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT NOT NULL DEFAULT '',
    "admin_id" INTEGER NOT NULL,
    "exchange_usd_id" INTEGER NOT NULL,
    "hmula_id" INTEGER NOT NULL,
    "type_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "currency_type" TEXT NOT NULL,

    CONSTRAINT "exchange_usd_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exchange_all_currency" (
    "id" SERIAL NOT NULL,
    "voucher_no" INTEGER,
    "fiscal_year" INTEGER,
    "currency_id" INTEGER NOT NULL,
    "exchange_type_id" INTEGER NOT NULL,
    "exchange_type" TEXT NOT NULL,
    "account_id" INTEGER NOT NULL,
    "amount_usd" DECIMAL(65,30) NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "amount_iqd" DECIMAL(65,30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT NOT NULL DEFAULT '',
    "admin_id" INTEGER NOT NULL,
    "exchange_all_id" INTEGER NOT NULL,
    "hmula_id" INTEGER NOT NULL,
    "type_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "currency_type" TEXT NOT NULL,

    CONSTRAINT "exchange_all_currency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment" (
    "id" SERIAL NOT NULL,
    "voucher_no" INTEGER,
    "fiscal_year" INTEGER,
    "currency_id" INTEGER NOT NULL,
    "currency_type" TEXT NOT NULL,
    "account_id" INTEGER NOT NULL,
    "payer" TEXT,
    "payer_phone" TEXT,
    "total_amount" DECIMAL(65,30) NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payment_type_id" INTEGER NOT NULL DEFAULT 0,
    "debtor_id" INTEGER NOT NULL,
    "dane_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL,

    CONSTRAINT "payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receipt" (
    "id" SERIAL NOT NULL,
    "voucher_no" INTEGER,
    "fiscal_year" INTEGER,
    "currency_id" INTEGER NOT NULL,
    "currency_type" TEXT NOT NULL,
    "account_id" INTEGER NOT NULL,
    "total_amount" DECIMAL(65,30) NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payer" TEXT,
    "payer_phone" TEXT,
    "receipt_type_id" INTEGER NOT NULL DEFAULT 0,
    "debtor_id" INTEGER NOT NULL,
    "dane_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL,

    CONSTRAINT "receipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense" (
    "id" SERIAL NOT NULL,
    "voucher_no" INTEGER NOT NULL,
    "fiscal_year" INTEGER NOT NULL,
    "currency_id" INTEGER NOT NULL,
    "currency_type" TEXT NOT NULL,
    "account_id" INTEGER NOT NULL,
    "total_amount" DECIMAL(65,30) NOT NULL,
    "expense_type_id" INTEGER NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "check_status" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract" (
    "id" SERIAL NOT NULL,
    "voucher_no" INTEGER NOT NULL,
    "fiscal_year" INTEGER NOT NULL,
    "contract_no" INTEGER,
    "currency_id" INTEGER NOT NULL,
    "currency_type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "info" TEXT,
    "total_amount" DECIMAL(65,30) NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "first_balance" (
    "id" SERIAL NOT NULL,
    "currency_id" INTEGER NOT NULL,
    "balance_type_id" INTEGER NOT NULL,
    "balance_type" TEXT NOT NULL,
    "voucher_no" INTEGER NOT NULL,
    "fiscal_year" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "account_id" INTEGER NOT NULL,
    "balance" DECIMAL(65,30) NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "first_balance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movement" (
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
    "receipt_no" INTEGER NOT NULL,

    CONSTRAINT "movement_pkey" PRIMARY KEY ("fiscal_year","id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admins_phone_key" ON "admins"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "account_types_type_key" ON "account_types"("type");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_account_id_key" ON "accounts"("account_id");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_phone_key" ON "accounts"("phone");

-- CreateIndex
CREATE INDEX "accounts_account_type_id_idx" ON "accounts"("account_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "address_city_key" ON "address"("city");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_phone_key" ON "supplier"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "categories_Name_key" ON "categories"("Name");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "sub_categories_name_key" ON "sub_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "currency_currency_id_key" ON "currency"("currency_id");

-- CreateIndex
CREATE UNIQUE INDEX "currency_currency_symbol_key" ON "currency"("currency_symbol");

-- CreateIndex
CREATE UNIQUE INDEX "currency_currency_key" ON "currency"("currency");

-- CreateIndex
CREATE UNIQUE INDEX "expense_type_type_key" ON "expense_type"("type");

-- CreateIndex
CREATE UNIQUE INDEX "voucher_counter_table_name_fiscal_year_key" ON "voucher_counter"("table_name", "fiscal_year");

-- CreateIndex
CREATE INDEX "send_transfer_com_sender_id_idx" ON "send_transfer"("com_sender_id");

-- CreateIndex
CREATE INDEX "send_transfer_com_receiver_id_idx" ON "send_transfer"("com_receiver_id");

-- CreateIndex
CREATE INDEX "send_transfer_currency_id_idx" ON "send_transfer"("currency_id");

-- CreateIndex
CREATE INDEX "send_transfer_created_at_idx" ON "send_transfer"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "send_transfer_fiscal_year_voucher_no_key" ON "send_transfer"("fiscal_year", "voucher_no");

-- CreateIndex
CREATE INDEX "income_transfer_com_sender_id_idx" ON "income_transfer"("com_sender_id");

-- CreateIndex
CREATE INDEX "income_transfer_currency_id_idx" ON "income_transfer"("currency_id");

-- CreateIndex
CREATE INDEX "income_transfer_created_at_idx" ON "income_transfer"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "income_transfer_fiscal_year_voucher_no_key" ON "income_transfer"("fiscal_year", "voucher_no");

-- CreateIndex
CREATE INDEX "cancelled_income_transfer_com_sender_id_idx" ON "cancelled_income_transfer"("com_sender_id");

-- CreateIndex
CREATE INDEX "cancelled_income_transfer_currency_id_idx" ON "cancelled_income_transfer"("currency_id");

-- CreateIndex
CREATE INDEX "cancelled_income_transfer_created_at_idx" ON "cancelled_income_transfer"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "cancelled_income_transfer_fiscal_year_voucher_no_key" ON "cancelled_income_transfer"("fiscal_year", "voucher_no");

-- CreateIndex
CREATE INDEX "paid_transfer_com_sender_id_idx" ON "paid_transfer"("com_sender_id");

-- CreateIndex
CREATE INDEX "paid_transfer_account_id_idx" ON "paid_transfer"("account_id");

-- CreateIndex
CREATE INDEX "paid_transfer_currency_id_idx" ON "paid_transfer"("currency_id");

-- CreateIndex
CREATE INDEX "paid_transfer_paid_date_idx" ON "paid_transfer"("paid_date");

-- CreateIndex
CREATE UNIQUE INDEX "paid_transfer_fiscal_year_voucher_no_key" ON "paid_transfer"("fiscal_year", "voucher_no");

-- CreateIndex
CREATE INDEX "cancelled_send_transfer_com_sender_id_idx" ON "cancelled_send_transfer"("com_sender_id");

-- CreateIndex
CREATE INDEX "cancelled_send_transfer_com_receiver_id_idx" ON "cancelled_send_transfer"("com_receiver_id");

-- CreateIndex
CREATE INDEX "cancelled_send_transfer_currency_id_idx" ON "cancelled_send_transfer"("currency_id");

-- CreateIndex
CREATE INDEX "cancelled_send_transfer_created_at_idx" ON "cancelled_send_transfer"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "cancelled_send_transfer_fiscal_year_voucher_no_key" ON "cancelled_send_transfer"("fiscal_year", "voucher_no");

-- CreateIndex
CREATE INDEX "exchange_usd_account_id_idx" ON "exchange_usd"("account_id");

-- CreateIndex
CREATE INDEX "exchange_usd_admin_id_idx" ON "exchange_usd"("admin_id");

-- CreateIndex
CREATE INDEX "exchange_usd_created_at_idx" ON "exchange_usd"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "exchange_usd_fiscal_year_voucher_no_key" ON "exchange_usd"("fiscal_year", "voucher_no");

-- CreateIndex
CREATE INDEX "exchange_all_currency_currency_id_idx" ON "exchange_all_currency"("currency_id");

-- CreateIndex
CREATE INDEX "exchange_all_currency_account_id_idx" ON "exchange_all_currency"("account_id");

-- CreateIndex
CREATE INDEX "exchange_all_currency_admin_id_idx" ON "exchange_all_currency"("admin_id");

-- CreateIndex
CREATE INDEX "exchange_all_currency_created_at_idx" ON "exchange_all_currency"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "exchange_all_currency_fiscal_year_voucher_no_key" ON "exchange_all_currency"("fiscal_year", "voucher_no");

-- CreateIndex
CREATE INDEX "payment_account_id_idx" ON "payment"("account_id");

-- CreateIndex
CREATE INDEX "payment_currency_id_idx" ON "payment"("currency_id");

-- CreateIndex
CREATE INDEX "payment_created_at_idx" ON "payment"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "payment_fiscal_year_voucher_no_key" ON "payment"("fiscal_year", "voucher_no");

-- CreateIndex
CREATE INDEX "receipt_account_id_idx" ON "receipt"("account_id");

-- CreateIndex
CREATE INDEX "receipt_currency_id_idx" ON "receipt"("currency_id");

-- CreateIndex
CREATE INDEX "receipt_created_at_idx" ON "receipt"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "receipt_fiscal_year_voucher_no_key" ON "receipt"("fiscal_year", "voucher_no");

-- CreateIndex
CREATE INDEX "expense_account_id_idx" ON "expense"("account_id");

-- CreateIndex
CREATE INDEX "expense_expense_type_id_idx" ON "expense"("expense_type_id");

-- CreateIndex
CREATE INDEX "expense_currency_id_idx" ON "expense"("currency_id");

-- CreateIndex
CREATE INDEX "expense_created_at_idx" ON "expense"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "expense_fiscal_year_voucher_no_key" ON "expense"("fiscal_year", "voucher_no");

-- CreateIndex
CREATE INDEX "contract_currency_id_idx" ON "contract"("currency_id");

-- CreateIndex
CREATE INDEX "contract_created_at_idx" ON "contract"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "contract_fiscal_year_voucher_no_key" ON "contract"("fiscal_year", "voucher_no");

-- CreateIndex
CREATE INDEX "first_balance_account_id_idx" ON "first_balance"("account_id");

-- CreateIndex
CREATE INDEX "first_balance_currency_id_idx" ON "first_balance"("currency_id");

-- CreateIndex
CREATE INDEX "first_balance_created_at_idx" ON "first_balance"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "first_balance_fiscal_year_voucher_no_key" ON "first_balance"("fiscal_year", "voucher_no");

-- CreateIndex
CREATE INDEX "movement_debtor_id_fiscal_year_idx" ON "movement"("debtor_id", "fiscal_year");

-- CreateIndex
CREATE INDEX "movement_creditor_id_fiscal_year_idx" ON "movement"("creditor_id", "fiscal_year");

-- CreateIndex
CREATE INDEX "movement_fiscal_year_voucher_no_idx" ON "movement"("fiscal_year", "voucher_no");

-- CreateIndex
CREATE INDEX "movement_created_at_idx" ON "movement"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "movement_fiscal_year_voucher_no_type_key" ON "movement"("fiscal_year", "voucher_no", "type");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_account_type_id_fkey" FOREIGN KEY ("account_type_id") REFERENCES "account_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sub_categories" ADD CONSTRAINT "sub_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "send_transfer" ADD CONSTRAINT "send_transfer_com_sender_id_fkey" FOREIGN KEY ("com_sender_id") REFERENCES "accounts"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "send_transfer" ADD CONSTRAINT "send_transfer_com_receiver_id_fkey" FOREIGN KEY ("com_receiver_id") REFERENCES "accounts"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "send_transfer" ADD CONSTRAINT "send_transfer_currency_id_fkey" FOREIGN KEY ("currency_id") REFERENCES "currency"("currency_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "send_transfer" ADD CONSTRAINT "send_transfer_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "send_transfer" ADD CONSTRAINT "send_transfer_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "income_transfer" ADD CONSTRAINT "income_transfer_com_sender_id_fkey" FOREIGN KEY ("com_sender_id") REFERENCES "accounts"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "income_transfer" ADD CONSTRAINT "income_transfer_currency_id_fkey" FOREIGN KEY ("currency_id") REFERENCES "currency"("currency_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "income_transfer" ADD CONSTRAINT "income_transfer_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cancelled_income_transfer" ADD CONSTRAINT "cancelled_income_transfer_com_sender_id_fkey" FOREIGN KEY ("com_sender_id") REFERENCES "accounts"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cancelled_income_transfer" ADD CONSTRAINT "cancelled_income_transfer_currency_id_fkey" FOREIGN KEY ("currency_id") REFERENCES "currency"("currency_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cancelled_income_transfer" ADD CONSTRAINT "cancelled_income_transfer_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paid_transfer" ADD CONSTRAINT "paid_transfer_com_sender_id_fkey" FOREIGN KEY ("com_sender_id") REFERENCES "accounts"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paid_transfer" ADD CONSTRAINT "paid_transfer_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paid_transfer" ADD CONSTRAINT "paid_transfer_currency_id_fkey" FOREIGN KEY ("currency_id") REFERENCES "currency"("currency_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paid_transfer" ADD CONSTRAINT "paid_transfer_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paid_transfer" ADD CONSTRAINT "paid_transfer_paid_transfer_address_id_fkey" FOREIGN KEY ("paid_transfer_address_id") REFERENCES "paid_transfer_address"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cancelled_send_transfer" ADD CONSTRAINT "cancelled_send_transfer_com_sender_id_fkey" FOREIGN KEY ("com_sender_id") REFERENCES "accounts"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cancelled_send_transfer" ADD CONSTRAINT "cancelled_send_transfer_com_receiver_id_fkey" FOREIGN KEY ("com_receiver_id") REFERENCES "accounts"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cancelled_send_transfer" ADD CONSTRAINT "cancelled_send_transfer_currency_id_fkey" FOREIGN KEY ("currency_id") REFERENCES "currency"("currency_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cancelled_send_transfer" ADD CONSTRAINT "cancelled_send_transfer_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cancelled_send_transfer" ADD CONSTRAINT "cancelled_send_transfer_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exchange_usd" ADD CONSTRAINT "exchange_usd_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exchange_usd" ADD CONSTRAINT "exchange_usd_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exchange_all_currency" ADD CONSTRAINT "exchange_all_currency_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exchange_all_currency" ADD CONSTRAINT "exchange_all_currency_currency_id_fkey" FOREIGN KEY ("currency_id") REFERENCES "currency"("currency_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exchange_all_currency" ADD CONSTRAINT "exchange_all_currency_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipt" ADD CONSTRAINT "receipt_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense" ADD CONSTRAINT "expense_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense" ADD CONSTRAINT "expense_expense_type_id_fkey" FOREIGN KEY ("expense_type_id") REFERENCES "expense_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "first_balance" ADD CONSTRAINT "first_balance_currency_id_fkey" FOREIGN KEY ("currency_id") REFERENCES "currency"("currency_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "first_balance" ADD CONSTRAINT "first_balance_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "first_balance" ADD CONSTRAINT "first_balance_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;
