CREATE OR REPLACE FUNCTION movement_after_send_transfer()
RETURNS TRIGGER AS $$
BEGIN
    -- Main transfer
    INSERT INTO movement (
        fiscal_year, type, voucher_no, created_at,
        debtor_id, amount_taking, creditor_id, amount_pay,
        currency_id, note, type_id, receipt_no
    ) VALUES (
        NEW.fiscal_year, 'حەوالە ناردن/حوالة صادرة', NEW.voucher_no, NEW.created_at,
        NEW.com_sender_id, NEW.amount_transfer,
        NEW.com_receiver_id, NEW.amount_transfer,
        NEW.currency_id, COALESCE(NEW.notes, ''), NEW.type_id, NEW.voucher_no
    );

    -- Commission to sender
    IF NEW.hmula_to_com_sender > 0 THEN
        INSERT INTO movement (
            fiscal_year, type, voucher_no, created_at,
            debtor_id, amount_taking, creditor_id, amount_pay,
            currency_id, note, type_id, receipt_no
        ) VALUES (
            NEW.fiscal_year,  'عمولە بۆ نێردەر/عمولة الحوالة (للمرسل)', NEW.voucher_no, NEW.created_at,
            NEW.hmula_id, NEW.hmula_to_com_sender,
            NEW.com_sender_id, NEW.hmula_to_com_sender,
            NEW.currency_id, 'عمولە بۆ نێردەر', NEW.type_id, NEW.voucher_no
        );
    END IF;

    -- Commission from sender
    IF NEW.hmula_from_com_sender > 0 THEN
        INSERT INTO movement (
            fiscal_year, type, voucher_no, created_at,
            debtor_id, amount_taking, creditor_id, amount_pay,
            currency_id, note, type_id, receipt_no
        ) VALUES (
            NEW.fiscal_year, 'عمولە لەسەر نێردەر/ من المرسل', NEW.voucher_no, NEW.created_at,
            NEW.com_sender_id, NEW.hmula_from_com_sender,
            NEW.hmula_id, NEW.hmula_from_com_sender,
            NEW.currency_id, 'عمولە لەسەر نێردەر', NEW.type_id, NEW.voucher_no
        );
    END IF;

    -- Commission to receiver
    IF NEW.hmula_to_com_receiver > 0 THEN
        INSERT INTO movement (
            fiscal_year, type, voucher_no, created_at,
            debtor_id, amount_taking, creditor_id, amount_pay,
            currency_id, note, type_id, receipt_no
        ) VALUES (
            NEW.fiscal_year, 'عمولە بۆ وەرگر', NEW.voucher_no, NEW.created_at,
            NEW.hmula_id, NEW.hmula_to_com_receiver,
            NEW.com_receiver_id, NEW.hmula_to_com_receiver,
            NEW.currency_id, 'عمولە بۆ وەرگر', NEW.type_id, NEW.voucher_no
        );
    END IF;

    -- Commission from receiver
    IF NEW.hmula_from_com_receiver > 0 THEN
        INSERT INTO movement (
            fiscal_year, type, voucher_no, created_at,
            debtor_id, amount_taking, creditor_id, amount_pay,
            currency_id, note, type_id, receipt_no
        ) VALUES (
            NEW.fiscal_year, 'عمولە لەسەر وەرگر/ من المستلم', NEW.voucher_no, NEW.created_at,
            NEW.com_receiver_id, NEW.hmula_from_com_receiver,
            NEW.hmula_id, NEW.hmula_from_com_receiver,
            NEW.currency_id, 'عمولە لەسەر وەرگر', NEW.type_id, NEW.voucher_no
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION movement_after_income_transfer()
RETURNS TRIGGER AS $$
BEGIN
    -- Main transfer
    INSERT INTO movement (
        fiscal_year, type, voucher_no, created_at,
        debtor_id, amount_taking, creditor_id, amount_pay,
        currency_id, note, type_id, receipt_no
    ) VALUES (
        NEW.fiscal_year, 'حەوالەی هاتوو/حوالة واردة', NEW.voucher_no, NEW.created_at,
        NEW.com_sender_id, NEW.amount_transfer,
        NEW.hawala_incom_id, NEW.amount_transfer,
        NEW.currency_id, COALESCE(NEW.notes, ''), NEW.type_id, NEW.voucher_no
    );

    -- Commission to sender
    IF NEW.hmula_to_com_sender > 0 THEN
        INSERT INTO movement (
            fiscal_year, type, voucher_no, created_at,
            debtor_id, amount_taking, creditor_id, amount_pay,
            currency_id, note, type_id, receipt_no
        ) VALUES (
            NEW.fiscal_year, 'عمولة الحوالة (للمرسل)', NEW.voucher_no, NEW.created_at,
            NEW.hmula_id, NEW.hmula_to_com_sender,
            NEW.com_sender_id, NEW.hmula_to_com_sender,
            NEW.currency_id, 'عمولە بۆ نێردەر', NEW.type_id, NEW.voucher_no
        );
    END IF;

    -- Commission from sender
    IF NEW.hmula_from_com_sender > 0 THEN
        INSERT INTO movement (
            fiscal_year, type, voucher_no, created_at,
            debtor_id, amount_taking, creditor_id, amount_pay,
            currency_id, note, type_id, receipt_no
        ) VALUES (
            NEW.fiscal_year, 'عمولة الحوالة (من المرسل)', NEW.voucher_no, NEW.created_at,
            NEW.com_sender_id, NEW.hmula_from_com_sender,
            NEW.hmula_id, NEW.hmula_from_com_sender,
            NEW.currency_id, 'عمولە لەسەر نێردەر', NEW.type_id, NEW.voucher_no
        );
    END IF;

    -- Commission from receiver
    IF NEW.hmula_from_receiver > 0 THEN
        INSERT INTO movement (
            fiscal_year, type, voucher_no, created_at,
            debtor_id, amount_taking, creditor_id, amount_pay,
            currency_id, note, type_id, receipt_no
        ) VALUES (
            NEW.fiscal_year, 'عمولة الحوالة (من المستلم)', NEW.voucher_no, NEW.created_at,
            NEW.hawala_incom_id, NEW.hmula_from_receiver,
            NEW.hmula_id, NEW.hmula_from_receiver,
            NEW.currency_id, 'عمولە لەسەر وەرگر', NEW.type_id, NEW.voucher_no
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION movement_after_exchange_all_currency()
RETURNS TRIGGER AS $$
DECLARE
    diff DECIMAL(19,4);
    iqd_currency_id CONSTANT INT := 2;
BEGIN
    diff := NEW.amount_iqd - (SELECT currency, currency_price * NEW.amount_usd FROM currency WHERE currency_id = NEW.currency_id);

    -- Main USD leg
    IF NOT EXISTS (
        SELECT 1 FROM movement
        WHERE fiscal_year = NEW.fiscal_year
          AND voucher_no = NEW.voucher_no
          AND type = 'ئاڵوگۆڕی دراوەکان/تصريف العملات - بە ' || (SELECT currency FROM currency WHERE currency_id = NEW.currency_id)
    ) THEN
        INSERT INTO movement (
            fiscal_year, type, voucher_no, created_at,
            debtor_id, amount_taking, creditor_id, amount_pay,
            currency_id, note, type_id, receipt_no
        ) VALUES (
            NEW.fiscal_year, 'ئاڵوگۆڕی دراوەکان/تصريف العملات - بە ' || (SELECT currency FROM currency WHERE currency_id = NEW.currency_id), NEW.voucher_no, NEW.created_at,
            CASE WHEN NEW.exchange_type_id = 1 THEN NEW.account_id ELSE NEW.exchange_all_id END,
            NEW.amount_usd,
            CASE WHEN NEW.exchange_type_id = 1 THEN NEW.exchange_all_id ELSE NEW.account_id END,
            NEW.amount_usd,
            NEW.currency_id, NEW.note, NEW.type_id, NEW.voucher_no
        );
    END IF;

    -- Main IQD leg
    IF NOT EXISTS (
        SELECT 1 FROM movement
        WHERE fiscal_year = NEW.fiscal_year
          AND voucher_no = NEW.voucher_no
          AND type = 'ئاڵوگۆڕی دراوەکان/تصريف العملات - بە دینار'
    ) THEN
        INSERT INTO movement (
            fiscal_year, type, voucher_no, created_at,
            debtor_id, amount_taking, creditor_id, amount_pay,
            currency_id, note, type_id, receipt_no
        ) VALUES (
            NEW.fiscal_year, 'ئاڵوگۆڕی دراوەکان/تصريف العملات - بە دینار', NEW.voucher_no, NEW.created_at,
            CASE WHEN NEW.exchange_type_id = 1 THEN NEW.exchange_all_id ELSE NEW.account_id END,
            NEW.amount_iqd,
            CASE WHEN NEW.exchange_type_id = 1 THEN NEW.account_id ELSE NEW.exchange_all_id END,
            NEW.amount_iqd,
            iqd_currency_id, NEW.note, NEW.type_id, NEW.voucher_no
        );
    END IF;

    -- Difference leg (if any)
    IF diff != 0 THEN
        IF NOT EXISTS (
            SELECT 1 FROM movement
            WHERE fiscal_year = NEW.fiscal_year
              AND voucher_no = NEW.voucher_no
              AND type = 'جیاوازی نرخ/فرق السعر'
        ) THEN
            IF diff < 0 THEN
                INSERT INTO movement (
                    fiscal_year, type, voucher_no, created_at,
                    debtor_id, amount_taking, creditor_id, amount_pay,
                    currency_id, note, type_id, receipt_no
                ) VALUES (
                    NEW.fiscal_year, 'جیاوازی نرخ/فرق السعر', NEW.voucher_no, NEW.created_at,
                    NEW.hmula_id, ABS(diff),
                    NEW.exchange_all_id, ABS(diff),
                    iqd_currency_id, 'فرق سعر', NEW.type_id, NEW.voucher_no
                );
            ELSE
                INSERT INTO movement (
                    fiscal_year, type, voucher_no, created_at,
                    debtor_id, amount_taking, creditor_id, amount_pay,
                    currency_id, note, type_id, receipt_no
                ) VALUES (
                    NEW.fiscal_year, 'جیاوازی نرخ/فرق السعر', NEW.voucher_no, NEW.created_at,
                    NEW.exchange_all_id, diff,
                    NEW.hmula_id, diff,
                    iqd_currency_id, 'فرق سعر', NEW.type_id, NEW.voucher_no
                );
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION movement_after_exchange_usd()
RETURNS TRIGGER AS $$
DECLARE
    diff DECIMAL(19,4);
    usd_currency_id CONSTANT INT := 1;
    iqd_currency_id CONSTANT INT := 2;
BEGIN
    diff := NEW.amount_iqd - (SELECT currency_price * NEW.amount_usd FROM currency WHERE currency_id = usd_currency_id);

    IF NEW.exchange_type_id = 1 THEN
        INSERT INTO movement (
            fiscal_year, type, voucher_no, created_at,
            debtor_id, amount_taking, creditor_id, amount_pay,
            currency_id, note, type_id, receipt_no
        ) VALUES (
            NEW.fiscal_year, 'ئاڵوگۆڕی دۆلار/صريف الدولار - بە دۆلار', NEW.voucher_no, NEW.created_at,
            NEW.account_id, NEW.amount_usd,
            NEW.exchange_usd_id, NEW.amount_usd,
            usd_currency_id, NEW.note, NEW.type_id, NEW.voucher_no
        );

        INSERT INTO movement (
            fiscal_year, type, voucher_no, created_at,
            debtor_id, amount_taking, creditor_id, amount_pay,
            currency_id, note, type_id, receipt_no
        ) VALUES (
            NEW.fiscal_year, 'ئاڵوگۆڕی دۆلار/صريف الدولار - بە دینار', NEW.voucher_no, NEW.created_at,
            NEW.exchange_usd_id, NEW.amount_iqd,
            NEW.account_id, NEW.amount_iqd,
            iqd_currency_id, NEW.note, NEW.type_id, NEW.voucher_no
        );

        IF diff < 0 THEN
            INSERT INTO movement (
                fiscal_year, type, voucher_no, created_at,
                debtor_id, amount_taking, creditor_id, amount_pay,
                currency_id, note, type_id, receipt_no
            ) VALUES (
                NEW.fiscal_year, 'جیاوازی نرخ/فرق السعر', NEW.voucher_no, NEW.created_at,
                NEW.hmula_id, ABS(diff),
                NEW.exchange_usd_id, ABS(diff),
                iqd_currency_id, 'عمولە', NEW.type_id, NEW.voucher_no
            );
        ELSIF diff > 0 THEN
            INSERT INTO movement (
                fiscal_year, type, voucher_no, created_at,
                debtor_id, amount_taking, creditor_id, amount_pay,
                currency_id, note, type_id, receipt_no
            ) VALUES (
                NEW.fiscal_year, 'جیاوازی نرخ/فرق السعر', NEW.voucher_no, NEW.created_at,
                NEW.exchange_usd_id, diff,
                NEW.hmula_id, diff,
                iqd_currency_id, 'عمولە', NEW.type_id, NEW.voucher_no
            );
        END IF;

    ELSIF NEW.exchange_type_id = 2 THEN
        INSERT INTO movement (
            fiscal_year, type, voucher_no, created_at,
            debtor_id, amount_taking, creditor_id, amount_pay,
            currency_id, note, type_id, receipt_no
        ) VALUES (
            NEW.fiscal_year, 'ئاڵوگۆڕی دۆلار/صريف الدولار - بە دۆلار', NEW.voucher_no, NEW.created_at,
            NEW.exchange_usd_id, NEW.amount_usd,
            NEW.account_id, NEW.amount_usd,
            usd_currency_id, NEW.note, NEW.type_id, NEW.voucher_no
        );

        INSERT INTO movement (
            fiscal_year, type, voucher_no, created_at,
            debtor_id, amount_taking, creditor_id, amount_pay,
            currency_id, note, type_id, receipt_no
        ) VALUES (
            NEW.fiscal_year, 'ئاڵوگۆڕی دۆلار/صريف الدولار - بە دینار', NEW.voucher_no, NEW.created_at,
            NEW.account_id, NEW.amount_iqd,
            NEW.exchange_usd_id, NEW.amount_iqd,
            iqd_currency_id, NEW.note, NEW.type_id, NEW.voucher_no
        );

        IF diff < 0 THEN
            INSERT INTO movement (
                fiscal_year, type, voucher_no, created_at,
                debtor_id, amount_taking, creditor_id, amount_pay,
                currency_id, note, type_id, receipt_no
            ) VALUES (
                NEW.fiscal_year, 'جیاوازی نرخ/فرق السعر', NEW.voucher_no, NEW.created_at,
                NEW.exchange_usd_id, ABS(diff),
                NEW.hmula_id, ABS(diff),
                iqd_currency_id, 'عمولە', NEW.type_id, NEW.voucher_no
            );
        ELSIF diff > 0 THEN
            INSERT INTO movement (
                fiscal_year, type, voucher_no, created_at,
                debtor_id, amount_taking, creditor_id, amount_pay,
                currency_id, note, type_id, receipt_no
            ) VALUES (
                NEW.fiscal_year, 'جیاوازی نرخ/فرق السعر', NEW.voucher_no, NEW.created_at,
                NEW.hmula_id, diff,
                NEW.exchange_usd_id, diff,
                iqd_currency_id, 'عمولە', NEW.type_id, NEW.voucher_no
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION movement_after_payment()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO movement (
        fiscal_year, type, voucher_no, created_at,
        debtor_id, amount_taking, creditor_id, amount_pay,
        currency_id, note, type_id, receipt_no
    ) VALUES (
        NEW.fiscal_year, 'پارەدان/دفع', NEW.voucher_no, NEW.created_at,
        NEW.debtor_id, NEW.total_amount,
        NEW.dane_id, NEW.total_amount,
        NEW.currency_id, NEW.note, NEW.payment_type_id, NEW.voucher_no
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION movement_after_receipt()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO movement (
        fiscal_year, type, voucher_no, created_at,
        debtor_id, amount_taking, creditor_id, amount_pay,
        currency_id, note, type_id, receipt_no
    ) VALUES (
        NEW.fiscal_year, 'پارەوەرگرتن/قبض', NEW.voucher_no, NEW.created_at,
        NEW.debtor_id, NEW.total_amount,
        NEW.dane_id, NEW.total_amount,
        NEW.currency_id, NEW.note, NEW.receipt_type_id, NEW.voucher_no
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION movement_after_paid_transfer()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert movement only if it does not already exist for this voucher and type
    IF NOT EXISTS (
        SELECT 1 FROM movement
        WHERE fiscal_year = NEW.fiscal_year
          AND voucher_no = NEW.voucher_no
          AND type = NEW.type   -- use the actual movement type you want
    ) THEN
        INSERT INTO movement (
            fiscal_year,
            type,
            voucher_no,
            created_at,
            debtor_id,
            amount_taking,
            creditor_id,
            amount_pay,
            currency_id,
            note,
            type_id,
            receipt_no
        ) VALUES (
            NEW.fiscal_year,
            'پارەدانی حەواڵەی هاتوو/تسدید الحوالة',          -- same type as in the check
            NEW.voucher_no,
            NEW.created_at,
            NEW.hawala_incom_id,
            NEW.total_transfer_to_receiver,
            NEW.account_id,
            NEW.total_transfer_to_receiver,
            NEW.currency_id,
            COALESCE(NEW.notes, ''),
            NEW.type_id,
            NEW.voucher_no
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_paid_transfer_movement
    AFTER INSERT ON paid_transfer
    FOR EACH ROW
    EXECUTE FUNCTION movement_after_paid_transfer();



   CREATE OR REPLACE FUNCTION movement_after_qaid()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO movement (
        fiscal_year, type, voucher_no, created_at,
        debtor_id, amount_taking, creditor_id, amount_pay,
        currency_id, note, type_id, receipt_no
    ) VALUES (
        NEW.fiscal_year,
        'القید/ گواستنەوەی پارە',
        NEW.voucher_no,
        NEW.created_at,
        NEW.com_sender_id,
        NEW.amount_transfer,
        NEW.com_receiver_id,
        NEW.amount_transfer,
        NEW.currency_id,
        COALESCE(NEW.notes, ''),
        NEW.type_id,
        NEW.voucher_no
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_qaid_movement ON qaid;
CREATE TRIGGER trg_qaid_movement
    AFTER INSERT ON qaid
    FOR EACH ROW
    EXECUTE FUNCTION movement_after_qaid();



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

-- Exchange All Currency
DROP TRIGGER IF EXISTS trg_exchange_all_currency_voucher ON exchange_all_currency;
CREATE TRIGGER trg_exchange_all_currency_voucher
    BEFORE INSERT ON exchange_all_currency
    FOR EACH ROW
    EXECUTE FUNCTION assign_voucher_no();

-- Exchange USD
DROP TRIGGER IF EXISTS trg_exchange_usd_voucher ON exchange_usd;
CREATE TRIGGER trg_exchange_usd_voucher
    BEFORE INSERT ON exchange_usd
    FOR EACH ROW
    EXECUTE FUNCTION assign_voucher_no();

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

-- Paid Transfer
DROP TRIGGER IF EXISTS trg_paid_transfer_voucher ON paid_transfer;
CREATE TRIGGER trg_paid_transfer_voucher
    BEFORE INSERT ON paid_transfer
    FOR EACH ROW
    EXECUTE FUNCTION assign_voucher_no();

-- Qaid
DROP TRIGGER IF EXISTS trg_qaid_voucher ON qaid;
CREATE TRIGGER trg_qaid_voucher
    BEFORE INSERT ON qaid
    FOR EACH ROW
    EXECUTE FUNCTION assign_voucher_no();




    --movement triggers
    DROP TRIGGER IF EXISTS trg_send_transfer_movement ON send_transfer;
CREATE TRIGGER trg_send_transfer_movement
    AFTER INSERT ON send_transfer
    FOR EACH ROW
    EXECUTE FUNCTION movement_after_send_transfer();

    DROP TRIGGER IF EXISTS trg_income_transfer_movement ON income_transfer;
CREATE TRIGGER trg_income_transfer_movement
    AFTER INSERT ON income_transfer
    FOR EACH ROW
    EXECUTE FUNCTION movement_after_income_transfer();

    DROP TRIGGER IF EXISTS trg_exchange_all_currency_movement ON exchange_all_currency;
CREATE TRIGGER trg_exchange_all_currency_movement
    AFTER INSERT ON exchange_all_currency
    FOR EACH ROW
    EXECUTE FUNCTION movement_after_exchange_all_currency();

    DROP TRIGGER IF EXISTS trg_exchange_usd_movement ON exchange_usd;
CREATE TRIGGER trg_exchange_usd_movement
    AFTER INSERT ON exchange_usd
    FOR EACH ROW
    EXECUTE FUNCTION movement_after_exchange_usd();

    DROP TRIGGER IF EXISTS trg_payment_movement ON payment;
CREATE TRIGGER trg_payment_movement
    AFTER INSERT ON payment
    FOR EACH ROW
    EXECUTE FUNCTION movement_after_payment();

    DROP TRIGGER IF EXISTS trg_receipt_movement ON receipt;
CREATE TRIGGER trg_receipt_movement
    AFTER INSERT ON receipt
    FOR EACH ROW
    EXECUTE FUNCTION movement_after_receipt();

    DROP TRIGGER IF EXISTS trg_paid_transfer_movement ON paid_transfer;
CREATE TRIGGER trg_paid_transfer_movement
    AFTER INSERT ON paid_transfer
    FOR EACH ROW
    EXECUTE FUNCTION movement_after_paid_transfer();

    DROP TRIGGER IF EXISTS trg_qaid_movement ON qaid;
CREATE TRIGGER trg_qaid_movement
    AFTER INSERT ON qaid
    FOR EACH ROW
    EXECUTE FUNCTION movement_after_qaid();