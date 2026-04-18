-- =============================================================================
-- COMPLETE FIX: Voucher Assignment + Kurdish Movement Types
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- PART 1: Ensure column types are TEXT (convert from INTEGER if necessary)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    -- Payment
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='payment' AND column_name='type' AND data_type='integer') THEN
        ALTER TABLE payment ALTER COLUMN type TYPE TEXT USING type::text;
    END IF;
    
    -- Receipt
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='receipt' AND column_name='type' AND data_type='integer') THEN
        ALTER TABLE receipt ALTER COLUMN type TYPE TEXT USING type::text;
    END IF;
    
    -- Send Transfer
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='send_transfer' AND column_name='type' AND data_type='integer') THEN
        ALTER TABLE send_transfer ALTER COLUMN type TYPE TEXT USING type::text;
    END IF;
    
    -- Income Transfer
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='income_transfer' AND column_name='type' AND data_type='integer') THEN
        ALTER TABLE income_transfer ALTER COLUMN type TYPE TEXT USING type::text;
    END IF;
    
    -- Paid Transfer
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='paid_transfer' AND column_name='type' AND data_type='integer') THEN
        ALTER TABLE paid_transfer ALTER COLUMN type TYPE TEXT USING type::text;
    END IF;
    
    -- Exchange USD
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='exchange_usd' AND column_name='type' AND data_type='integer') THEN
        ALTER TABLE exchange_usd ALTER COLUMN type TYPE TEXT USING type::text;
    END IF;
    
    -- Exchange All Currency
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='exchange_all_currency' AND column_name='type' AND data_type='integer') THEN
        ALTER TABLE exchange_all_currency ALTER COLUMN type TYPE TEXT USING type::text;
    END IF;
    
    -- Cancelled Send Transfer
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='cancelled_send_transfer' AND column_name='type' AND data_type='integer') THEN
        ALTER TABLE cancelled_send_transfer ALTER COLUMN type TYPE TEXT USING type::text;
    END IF;
    
    -- Cancelled Income Transfer
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='cancelled_income_transfer' AND column_name='type' AND data_type='integer') THEN
        ALTER TABLE cancelled_income_transfer ALTER COLUMN type TYPE TEXT USING type::text;
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- PART 2: Voucher Counter Table (if not exists)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS voucher_counter (
    id            SERIAL PRIMARY KEY,
    table_name    TEXT NOT NULL,
    fiscal_year   INT NOT NULL,
    next_voucher  INT NOT NULL DEFAULT 1,
    UNIQUE (table_name, fiscal_year)
);

-- -----------------------------------------------------------------------------
-- PART 3: Voucher Assignment Function
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION assign_voucher_no()
RETURNS TRIGGER AS $$
DECLARE
    next_no INTEGER;
    year INTEGER;
    key_type_id INTEGER;
    has_type_column BOOLEAN;
BEGIN
    -- Ensure created_at is set
    IF NEW.created_at IS NULL THEN
        NEW.created_at := now();
    END IF;

    year := EXTRACT(YEAR FROM NEW.created_at);
    NEW.fiscal_year := year;

    -- Safely check if the table has a 'type_id' column
    BEGIN
        EXECUTE format('SELECT ($1).%I IS NOT NULL', 'type_id') INTO has_type_column USING NEW;
    EXCEPTION WHEN undefined_column THEN
        has_type_column := FALSE;
    END;

    IF has_type_column THEN
        EXECUTE format('SELECT ($1).%I', 'type_id') INTO key_type_id USING NEW;
    ELSE
        key_type_id := NULL;
    END IF;

    -- Atomically get next voucher number
    INSERT INTO voucher_counter (table_name, fiscal_year, type_id, next_voucher)
    VALUES (TG_TABLE_NAME, year, key_type_id, 2)
    ON CONFLICT (table_name, fiscal_year, type_id) DO UPDATE
        SET next_voucher = voucher_counter.next_voucher + 1
    RETURNING next_voucher - 1 INTO next_no;

    -- If the insert didn't return (should not happen), fallback to 1
    IF NOT FOUND THEN
        next_no := 1;
    END IF;

    NEW.voucher_no := next_no;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- PART 4: BEFORE INSERT Triggers (Voucher Assignment)
-- -----------------------------------------------------------------------------
-- Payment
DROP TRIGGER IF EXISTS trg_payment_voucher ON payment;
CREATE TRIGGER trg_payment_voucher
    BEFORE INSERT ON payment
    FOR EACH ROW
    EXECUTE FUNCTION assign_voucher_no();

-- Receipt
DROP TRIGGER IF EXISTS trg_receipt_voucher ON receipt;
CREATE TRIGGER trg_receipt_voucher
    BEFORE INSERT ON receipt
    FOR EACH ROW
    EXECUTE FUNCTION assign_voucher_no();

-- Send Transfer
DROP TRIGGER IF EXISTS trg_send_transfer_voucher ON send_transfer;
CREATE TRIGGER trg_send_transfer_voucher
    BEFORE INSERT ON send_transfer
    FOR EACH ROW
    EXECUTE FUNCTION assign_voucher_no();

-- Income Transfer
DROP TRIGGER IF EXISTS trg_income_transfer_voucher ON income_transfer;
CREATE TRIGGER trg_income_transfer_voucher
    BEFORE INSERT ON income_transfer
    FOR EACH ROW
    EXECUTE FUNCTION assign_voucher_no();

-- Exchange USD
DROP TRIGGER IF EXISTS trg_exchange_usd_voucher ON exchange_usd;
CREATE TRIGGER trg_exchange_usd_voucher
    BEFORE INSERT ON exchange_usd
    FOR EACH ROW
    EXECUTE FUNCTION assign_voucher_no();

-- Exchange All Currency
DROP TRIGGER IF EXISTS trg_exchange_all_currency_voucher ON exchange_all_currency;
CREATE TRIGGER trg_exchange_all_currency_voucher
    BEFORE INSERT ON exchange_all_currency
    FOR EACH ROW
    EXECUTE FUNCTION assign_voucher_no();

    -- First Balance
DROP TRIGGER IF EXISTS trg_first_balance_voucher ON first_balance;
CREATE TRIGGER trg_first_balance_voucher
    BEFORE INSERT ON first_balance
    FOR EACH ROW
    EXECUTE FUNCTION assign_voucher_no();

-- Cancelled Send Transfer
DROP TRIGGER IF EXISTS trg_cancelled_send_transfer_voucher ON cancelled_send_transfer;
CREATE TRIGGER trg_cancelled_send_transfer_voucher
    BEFORE INSERT ON cancelled_send_transfer
    FOR EACH ROW
    EXECUTE FUNCTION assign_voucher_no();

-- Cancelled Income Transfer
DROP TRIGGER IF EXISTS trg_cancelled_income_transfer_voucher ON cancelled_income_transfer;
CREATE TRIGGER trg_cancelled_income_transfer_voucher
    BEFORE INSERT ON cancelled_income_transfer
    FOR EACH ROW
    EXECUTE FUNCTION assign_voucher_no();



-- Expense (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'expense') THEN
        DROP TRIGGER IF EXISTS trg_expense_voucher ON expense;
        EXECUTE 'CREATE TRIGGER trg_expense_voucher BEFORE INSERT ON expense FOR EACH ROW EXECUTE FUNCTION assign_voucher_no()';
    END IF;
END $$;

-- Contract (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contract') THEN
        DROP TRIGGER IF EXISTS trg_contract_voucher ON contract;
        EXECUTE 'CREATE TRIGGER trg_contract_voucher BEFORE INSERT ON contract FOR EACH ROW EXECUTE FUNCTION assign_voucher_no()';
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- PART 5: AFTER INSERT Triggers – Movement Population (Kurdish Names)
-- -----------------------------------------------------------------------------

-- 5.1 SEND TRANSFER – with Kurdish commission type
CREATE OR REPLACE FUNCTION movement_after_send_transfer()
RETURNS TRIGGER AS $$
BEGIN
    -- Main transfer
    INSERT INTO movement VALUES (
        NEW.fiscal_year, 'حەوالە ناردن/حوالة صادرة', NEW.voucher_no, NEW.created_at,
        NEW.com_sender_id, NEW.amount_transfer,
        NEW.com_receiver_id, NEW.total_transfer_to_receiver,
        NEW.currency_id, COALESCE(NEW.notes, ''), NEW.type_id, NEW.voucher_no
    );
    -- Commission to sender
    IF NEW.hmulato_com_sender > 0 THEN
        INSERT INTO movement VALUES (
            NEW.fiscal_year, 'عمولەی حەوالە/عمولة الحوالة', NEW.voucher_no, NEW.created_at,
            NEW.hmula_id, NEW.hmulato_com_sender,
            NEW.com_sender_id, NEW.hmulato_com_sender,
            NEW.currency_id, 'عمولە بۆ نێردەر', NEW.type_id, NEW.voucher_no
        );
    END IF;
    -- Commission from sender
    IF NEW.hmula_from_com_sender > 0 THEN
        INSERT INTO movement VALUES (
            NEW.fiscal_year, 'عمولەی حەوالە/عمولة الحوالة', NEW.voucher_no, NEW.created_at,
            NEW.com_sender_id, NEW.hmula_from_com_sender,
            NEW.hmula_id, NEW.hmula_from_com_sender,
            NEW.currency_id, 'عمولە لەسەر نێردەر', NEW.type_id, NEW.voucher_no
        );
    END IF;
    -- Commission to receiver
    IF NEW.hmulato_com_receiver > 0 THEN
        INSERT INTO movement VALUES (
            NEW.fiscal_year, 'عمولەی حەوالە/عمولة الحوالة', NEW.voucher_no, NEW.created_at,
            NEW.hmula_id, NEW.hmulato_com_receiver,
            NEW.com_receiver_id, NEW.hmulato_com_receiver,
            NEW.currency_id, 'عمولە بۆ وەرگر', NEW.type_id, NEW.voucher_no
        );
    END IF;
    -- Commission from receiver
    IF NEW.hmula_from_com_receiver > 0 THEN
        INSERT INTO movement VALUES (
            NEW.fiscal_year, 'عمولەی حەوالە/عمولة الحوالة', NEW.voucher_no, NEW.created_at,
            NEW.com_receiver_id, NEW.hmula_from_com_receiver,
            NEW.hmula_id, NEW.hmula_from_com_receiver,
            NEW.currency_id, 'عمولە لەسەر وەرگر', NEW.type_id, NEW.voucher_no
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_send_transfer_movement ON send_transfer;
CREATE TRIGGER trg_send_transfer_movement
    AFTER INSERT ON send_transfer
    FOR EACH ROW
    EXECUTE FUNCTION movement_after_send_transfer();

-- 5.2 INCOME TRANSFER – with Kurdish commission type
CREATE OR REPLACE FUNCTION movement_after_income_transfer()
RETURNS TRIGGER AS $$
BEGIN
    -- Main transfer
    INSERT INTO movement VALUES (
        NEW.fiscal_year, 'حەوالەی هاتوو/حوالة واردة', NEW.voucher_no, NEW.created_at,
        NEW.com_sender_id, NEW.amount_transfer,
        NEW.hawala_incom_id, NEW.total_transfer_to_receiver,
        NEW.currency_id, COALESCE(NEW.notes, ''), NEW.type_id, NEW.voucher_no
    );
    -- Commission to sender
    IF NEW.hmulato_com_sender > 0 THEN
        INSERT INTO movement VALUES (
            NEW.fiscal_year, 'عمولەی حەوالە/عمولة الحوالة', NEW.voucher_no, NEW.created_at,
            NEW.hmula_id, NEW.hmulato_com_sender,
            NEW.com_sender_id, NEW.hmulato_com_sender,
            NEW.currency_id, 'عمولە بۆ نێردەر', NEW.type_id, NEW.voucher_no
        );
    END IF;
    -- Commission from sender
    IF NEW.hmula_from_com_sender > 0 THEN
        INSERT INTO movement VALUES (
            NEW.fiscal_year, 'عمولەی حەوالە/عمولة الحوالة', NEW.voucher_no, NEW.created_at,
            NEW.com_sender_id, NEW.hmula_from_com_sender,
            NEW.hmula_id, NEW.hmula_from_com_sender,
            NEW.currency_id, 'عمولە لەسەر نێردەر', NEW.type_id, NEW.voucher_no
        );
    END IF;
    -- Commission from receiver
    IF NEW.hmula_from_receiver > 0 THEN
        INSERT INTO movement VALUES (
            NEW.fiscal_year, 'عمولەی حەوالە/عمولة الحوالة', NEW.voucher_no, NEW.created_at,
            NEW.hawala_incom_id, NEW.hmula_from_receiver,
            NEW.hmula_id, NEW.hmula_from_receiver,
            NEW.currency_id, 'عمولە لەسەر وەرگر', NEW.type_id, NEW.voucher_no
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_income_transfer_movement ON income_transfer;
CREATE TRIGGER trg_income_transfer_movement
    AFTER INSERT ON income_transfer
    FOR EACH ROW
    EXECUTE FUNCTION movement_after_income_transfer();

-- 5.3 EXCHANGE ALL CURRENCY – with Kurdish diff type
CREATE OR REPLACE FUNCTION movement_after_exchange_all_currency()
RETURNS TRIGGER AS $$
DECLARE
    diff DECIMAL(19,4);
    iqd_currency_id CONSTANT INT := 2;
BEGIN
    diff := NEW.amount_iqd - (SELECT currency_price * NEW.amount_usd FROM currency WHERE currency_id = NEW.currency_id);

    IF NEW.exchange_type_id = 1 THEN
        INSERT INTO movement VALUES (NEW.fiscal_year, 'ئاڵوگۆڕی دراوەکان/تصريف العملات', NEW.voucher_no, NEW.created_at,
            NEW.account_id, NEW.amount_usd,
            NEW.exchange_all_id, NEW.amount_usd,
            NEW.currency_id, NEW.note, NEW.type_id, NEW.voucher_no);
        INSERT INTO movement VALUES (NEW.fiscal_year, 'ئاڵوگۆڕی دراوەکان/تصريف العملات', NEW.voucher_no, NEW.created_at,
            NEW.exchange_all_id, NEW.amount_iqd,
            NEW.account_id, NEW.amount_iqd,
            iqd_currency_id, NEW.note, NEW.type_id, NEW.voucher_no);

        IF diff < 0 THEN
            INSERT INTO movement VALUES (NEW.fiscal_year, 'جیاوازی نرخ/فرق السعر', NEW.voucher_no, NEW.created_at,
                NEW.hmula_id, ABS(diff),
                NEW.exchange_all_id, ABS(diff),
                iqd_currency_id, 'فرق سعر', NEW.type_id, NEW.voucher_no);
        ELSIF diff > 0 THEN
            INSERT INTO movement VALUES (NEW.fiscal_year, 'جیاوازی نرخ/فرق السعر', NEW.voucher_no, NEW.created_at,
                NEW.exchange_all_id, diff,
                NEW.hmula_id, diff,
                iqd_currency_id, 'فرق سعر', NEW.type_id, NEW.voucher_no);
        END IF;

    ELSIF NEW.exchange_type_id = 2 THEN
        INSERT INTO movement VALUES (NEW.fiscal_year, 'ئاڵوگۆڕی دراوەکان/تصريف العملات', NEW.voucher_no, NEW.created_at,
            NEW.exchange_all_id, NEW.amount_usd,
            NEW.account_id, NEW.amount_usd,
            NEW.currency_id, NEW.note, NEW.type_id, NEW.voucher_no);
        INSERT INTO movement VALUES (NEW.fiscal_year, 'ئاڵوگۆڕی دراوەکان/تصريف العملات', NEW.voucher_no, NEW.created_at,
            NEW.account_id, NEW.amount_iqd,
            NEW.exchange_all_id, NEW.amount_iqd,
            iqd_currency_id, NEW.note, NEW.type_id, NEW.voucher_no);

        IF diff < 0 THEN
            INSERT INTO movement VALUES (NEW.fiscal_year, 'جیاوازی نرخ/فرق السعر', NEW.voucher_no, NEW.created_at,
                NEW.exchange_all_id, ABS(diff),
                NEW.hmula_id, ABS(diff),
                iqd_currency_id, 'فرق سعر', NEW.type_id, NEW.voucher_no);
        ELSIF diff > 0 THEN
            INSERT INTO movement VALUES (NEW.fiscal_year, 'جیاوازی نرخ/فرق السعر', NEW.voucher_no, NEW.created_at,
                NEW.hmula_id, diff,
                NEW.exchange_all_id, diff,
                iqd_currency_id, 'فرق سعر', NEW.type_id, NEW.voucher_no);
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_exchange_all_currency_movement ON exchange_all_currency;
CREATE TRIGGER trg_exchange_all_currency_movement
    AFTER INSERT ON exchange_all_currency
    FOR EACH ROW
    EXECUTE FUNCTION movement_after_exchange_all_currency();

-- 5.4 EXCHANGE USD – with Kurdish diff type
CREATE OR REPLACE FUNCTION movement_after_exchange_usd()
RETURNS TRIGGER AS $$
DECLARE
    diff DECIMAL(19,4);
    usd_currency_id CONSTANT INT := 1;
    iqd_currency_id CONSTANT INT := 2;
BEGIN
    diff := NEW.amount_iqd - (SELECT currency_price * NEW.amount_usd FROM currency WHERE currency_id = usd_currency_id);

    IF NEW.exchange_type_id = 1 THEN
        INSERT INTO movement VALUES (NEW.fiscal_year, 'ئاڵوگۆڕی دۆلار/صريف الدولار', NEW.voucher_no, NEW.created_at,
            NEW.account_id, NEW.amount_usd,
            NEW.exchange_usd_id, NEW.amount_usd,
            usd_currency_id, NEW.note, NEW.type_id, NEW.voucher_no);
        INSERT INTO movement VALUES (NEW.fiscal_year, 'ئاڵوگۆڕی دۆلار/صريف الدولار', NEW.voucher_no, NEW.created_at,
            NEW.exchange_usd_id, NEW.amount_iqd,
            NEW.account_id, NEW.amount_iqd,
            iqd_currency_id, NEW.note, NEW.type_id, NEW.voucher_no);

        IF diff < 0 THEN
            INSERT INTO movement VALUES (NEW.fiscal_year, 'جیاوازی نرخ/فرق السعر', NEW.voucher_no, NEW.created_at,
                NEW.hmula_id, ABS(diff),
                NEW.exchange_usd_id, ABS(diff),
                iqd_currency_id, 'فرق سعر', NEW.type_id, NEW.voucher_no);
        ELSIF diff > 0 THEN
            INSERT INTO movement VALUES (NEW.fiscal_year, 'جیاوازی نرخ/فرق السعر', NEW.voucher_no, NEW.created_at,
                NEW.exchange_usd_id, diff,
                NEW.hmula_id, diff,
                iqd_currency_id, 'فرق سعر', NEW.type_id, NEW.voucher_no);
        END IF;

    ELSIF NEW.exchange_type_id = 2 THEN
        INSERT INTO movement VALUES (NEW.fiscal_year, 'ئاڵوگۆڕی دۆلار/صريف الدولار', NEW.voucher_no, NEW.created_at,
            NEW.exchange_usd_id, NEW.amount_usd,
            NEW.account_id, NEW.amount_usd,
            usd_currency_id, NEW.note, NEW.type_id, NEW.voucher_no);
        INSERT INTO movement VALUES (NEW.fiscal_year, 'ئاڵوگۆڕی دۆلار/صريف الدولار', NEW.voucher_no, NEW.created_at,
            NEW.account_id, NEW.amount_iqd,
            NEW.exchange_usd_id, NEW.amount_iqd,
            iqd_currency_id, NEW.note, NEW.type_id, NEW.voucher_no);

        IF diff < 0 THEN
            INSERT INTO movement VALUES (NEW.fiscal_year, 'جیاوازی نرخ/فرق السعر', NEW.voucher_no, NEW.created_at,
                NEW.exchange_usd_id, ABS(diff),
                NEW.hmula_id, ABS(diff),
                iqd_currency_id, 'فرق سعر', NEW.type_id, NEW.voucher_no);
        ELSIF diff > 0 THEN
            INSERT INTO movement VALUES (NEW.fiscal_year, 'جیاوازی نرخ/فرق السعر', NEW.voucher_no, NEW.created_at,
                NEW.hmula_id, diff,
                NEW.exchange_usd_id, diff,
                iqd_currency_id, 'فرق سعر', NEW.type_id, NEW.voucher_no);
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_exchange_usd_movement ON exchange_usd;
CREATE TRIGGER trg_exchange_usd_movement
    AFTER INSERT ON exchange_usd
    FOR EACH ROW
    EXECUTE FUNCTION movement_after_exchange_usd();

-- 5.5 PAYMENT – Kurdish type
CREATE OR REPLACE FUNCTION movement_after_payment()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO movement VALUES (
        NEW.fiscal_year, 'پارەدان/دفع', NEW.voucher_no, NEW.created_at,
        NEW.debtor_id, NEW.total_amount,
        NEW.dane_id, NEW.total_amount,
        NEW.currency_id, NEW.note, NEW.payment_type_id, NEW.voucher_no
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_payment_movement ON payment;
CREATE TRIGGER trg_payment_movement
    AFTER INSERT ON payment
    FOR EACH ROW
    EXECUTE FUNCTION movement_after_payment();

-- 5.6 RECEIPT – Kurdish type
CREATE OR REPLACE FUNCTION movement_after_receipt()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO movement VALUES (
        NEW.fiscal_year, 'پارەوەرگرتن/قبض', NEW.voucher_no, NEW.created_at,
        NEW.debtor_id, NEW.total_amount,
        NEW.dane_id, NEW.total_amount,
        NEW.currency_id, NEW.note, NEW.receipt_type_id, NEW.voucher_no
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_receipt_movement ON receipt;
CREATE TRIGGER trg_receipt_movement
    AFTER INSERT ON receipt
    FOR EACH ROW
    EXECUTE FUNCTION movement_after_receipt();

-- 5.7 PAID TRANSFER – Kurdish type
CREATE OR REPLACE FUNCTION movement_after_paid_transfer()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO movement VALUES (
        NEW.fiscal_year, 'پارەدانی حەوالە/تسدید الحوالة', NEW.voucher_no, NEW.created_at,
        NEW.hawala_incom_id, NEW.total_transfer_to_receiver,
        NEW.account_id, NEW.total_transfer_to_receiver,
        NEW.currency_id, NEW.notes, NEW.type_id, NEW.voucher_no
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_paid_transfer_movement ON paid_transfer;
CREATE TRIGGER trg_paid_transfer_movement
    AFTER INSERT ON paid_transfer
    FOR EACH ROW
    EXECUTE FUNCTION movement_after_paid_transfer();

-- 5.8 FIRST BALANCE – Kurdish type
CREATE OR REPLACE FUNCTION movement_after_first_balance()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO movement VALUES (
        NEW.fiscal_year, 'بەڵانسی سەرەتایی/رصید البدائي', NEW.voucher_no, NEW.created_at,
        NEW.account_id, NEW.balance,
        3000, NEW.balance,
        NEW.currency_id, NEW.note, 0, NEW.voucher_no
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_first_balance_movement ON first_balance;
CREATE TRIGGER trg_first_balance_movement
    AFTER INSERT ON first_balance
    FOR EACH ROW
    EXECUTE FUNCTION movement_after_first_balance();

COMMIT;