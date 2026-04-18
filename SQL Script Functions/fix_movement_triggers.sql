-- =============================================================================
-- COMPLETE FIX: All movement trigger functions with explicit column lists
-- =============================================================================

-- 5.1 SEND TRANSFER – with Kurdish commission type
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
        NEW.com_receiver_id, NEW.total_transfer_to_receiver,
        NEW.currency_id, COALESCE(NEW.notes, ''), NEW.type_id, NEW.voucher_no
    );

    -- Commission to sender
    IF NEW.hmulato_com_sender > 0 THEN
        INSERT INTO movement (
            fiscal_year, type, voucher_no, created_at,
            debtor_id, amount_taking, creditor_id, amount_pay,
            currency_id, note, type_id, receipt_no
        ) VALUES (
            NEW.fiscal_year, 'عمولەی حەوالە/عمولة الحوالة', NEW.voucher_no, NEW.created_at,
            NEW.hmula_id, NEW.hmulato_com_sender,
            NEW.com_sender_id, NEW.hmulato_com_sender,
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
            NEW.fiscal_year, 'عمولەی حەوالە/عمولة الحوالة', NEW.voucher_no, NEW.created_at,
            NEW.com_sender_id, NEW.hmula_from_com_sender,
            NEW.hmula_id, NEW.hmula_from_com_sender,
            NEW.currency_id, 'عمولە لەسەر نێردەر', NEW.type_id, NEW.voucher_no
        );
    END IF;

    -- Commission to receiver
    IF NEW.hmulato_com_receiver > 0 THEN
        INSERT INTO movement (
            fiscal_year, type, voucher_no, created_at,
            debtor_id, amount_taking, creditor_id, amount_pay,
            currency_id, note, type_id, receipt_no
        ) VALUES (
            NEW.fiscal_year, 'عمولەی حەوالە/عمولة الحوالة', NEW.voucher_no, NEW.created_at,
            NEW.hmula_id, NEW.hmulato_com_receiver,
            NEW.com_receiver_id, NEW.hmulato_com_receiver,
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
            NEW.fiscal_year, 'عمولەی حەوالە/عمولة الحوالة', NEW.voucher_no, NEW.created_at,
            NEW.com_receiver_id, NEW.hmula_from_com_receiver,
            NEW.hmula_id, NEW.hmula_from_com_receiver,
            NEW.currency_id, 'عمولە لەسەر وەرگر', NEW.type_id, NEW.voucher_no
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5.2 INCOME TRANSFER – with Kurdish commission type
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
        NEW.hawala_incom_id, NEW.total_transfer_to_receiver,
        NEW.currency_id, COALESCE(NEW.notes, ''), NEW.type_id, NEW.voucher_no
    );

    -- Commission to sender
    IF NEW.hmulato_com_sender > 0 THEN
        INSERT INTO movement (
            fiscal_year, type, voucher_no, created_at,
            debtor_id, amount_taking, creditor_id, amount_pay,
            currency_id, note, type_id, receipt_no
        ) VALUES (
            NEW.fiscal_year, 'عمولەی حەوالە/عمولة الحوالة', NEW.voucher_no, NEW.created_at,
            NEW.hmula_id, NEW.hmulato_com_sender,
            NEW.com_sender_id, NEW.hmulato_com_sender,
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
            NEW.fiscal_year, 'عمولەی حەوالە/عمولة الحوالة', NEW.voucher_no, NEW.created_at,
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
            NEW.fiscal_year, 'عمولەی حەوالە/عمولة الحوالة', NEW.voucher_no, NEW.created_at,
            NEW.hawala_incom_id, NEW.hmula_from_receiver,
            NEW.hmula_id, NEW.hmula_from_receiver,
            NEW.currency_id, 'عمولە لەسەر وەرگر', NEW.type_id, NEW.voucher_no
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5.3 EXCHANGE ALL CURRENCY – with Kurdish diff type
CREATE OR REPLACE FUNCTION movement_after_exchange_all_currency()
RETURNS TRIGGER AS $$
DECLARE
    diff DECIMAL(19,4);
    iqd_currency_id CONSTANT INT := 2;
BEGIN
    diff := NEW.amount_iqd - (SELECT currency_price * NEW.amount_usd FROM currency WHERE currency_id = NEW.currency_id);

    IF NEW.exchange_type_id = 1 THEN
        -- USD from account → exchangeAll, IQD from exchangeAll → account
        INSERT INTO movement (
            fiscal_year, type, voucher_no, created_at,
            debtor_id, amount_taking, creditor_id, amount_pay,
            currency_id, note, type_id, receipt_no
        ) VALUES (
            NEW.fiscal_year, 'ئاڵوگۆڕی دراوەکان/تصريف العملات', NEW.voucher_no, NEW.created_at,
            NEW.account_id, NEW.amount_usd,
            NEW.exchange_all_id, NEW.amount_usd,
            NEW.currency_id, NEW.note, NEW.type_id, NEW.voucher_no
        );

        INSERT INTO movement (
            fiscal_year, type, voucher_no, created_at,
            debtor_id, amount_taking, creditor_id, amount_pay,
            currency_id, note, type_id, receipt_no
        ) VALUES (
            NEW.fiscal_year, 'ئاڵوگۆڕی دراوەکان/تصريف العملات', NEW.voucher_no, NEW.created_at,
            NEW.exchange_all_id, NEW.amount_iqd,
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
                NEW.exchange_all_id, ABS(diff),
                iqd_currency_id, 'فرق سعر', NEW.type_id, NEW.voucher_no
            );
        ELSIF diff > 0 THEN
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

    ELSIF NEW.exchange_type_id = 2 THEN
        -- USD from exchangeAll → account, IQD from account → exchangeAll
        INSERT INTO movement (
            fiscal_year, type, voucher_no, created_at,
            debtor_id, amount_taking, creditor_id, amount_pay,
            currency_id, note, type_id, receipt_no
        ) VALUES (
            NEW.fiscal_year, 'ئاڵوگۆڕی دراوەکان/تصريف العملات', NEW.voucher_no, NEW.created_at,
            NEW.exchange_all_id, NEW.amount_usd,
            NEW.account_id, NEW.amount_usd,
            NEW.currency_id, NEW.note, NEW.type_id, NEW.voucher_no
        );

        INSERT INTO movement (
            fiscal_year, type, voucher_no, created_at,
            debtor_id, amount_taking, creditor_id, amount_pay,
            currency_id, note, type_id, receipt_no
        ) VALUES (
            NEW.fiscal_year, 'ئاڵوگۆڕی دراوەکان/تصريف العملات', NEW.voucher_no, NEW.created_at,
            NEW.account_id, NEW.amount_iqd,
            NEW.exchange_all_id, NEW.amount_iqd,
            iqd_currency_id, NEW.note, NEW.type_id, NEW.voucher_no
        );

        IF diff < 0 THEN
            INSERT INTO movement (
                fiscal_year, type, voucher_no, created_at,
                debtor_id, amount_taking, creditor_id, amount_pay,
                currency_id, note, type_id, receipt_no
            ) VALUES (
                NEW.fiscal_year, 'جیاوازی نرخ/فرق السعر', NEW.voucher_no, NEW.created_at,
                NEW.exchange_all_id, ABS(diff),
                NEW.hmula_id, ABS(diff),
                iqd_currency_id, 'فرق سعر', NEW.type_id, NEW.voucher_no
            );
        ELSIF diff > 0 THEN
            INSERT INTO movement (
                fiscal_year, type, voucher_no, created_at,
                debtor_id, amount_taking, creditor_id, amount_pay,
                currency_id, note, type_id, receipt_no
            ) VALUES (
                NEW.fiscal_year, 'جیاوازی نرخ/فرق السعر', NEW.voucher_no, NEW.created_at,
                NEW.hmula_id, diff,
                NEW.exchange_all_id, diff,
                iqd_currency_id, 'فرق سعر', NEW.type_id, NEW.voucher_no
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
        INSERT INTO movement (
            fiscal_year, type, voucher_no, created_at,
            debtor_id, amount_taking, creditor_id, amount_pay,
            currency_id, note, type_id, receipt_no
        ) VALUES (
            NEW.fiscal_year, 'ئاڵوگۆڕی دۆلار/صريف الدولار', NEW.voucher_no, NEW.created_at,
            NEW.account_id, NEW.amount_usd,
            NEW.exchange_usd_id, NEW.amount_usd,
            usd_currency_id, NEW.note, NEW.type_id, NEW.voucher_no
        );

        INSERT INTO movement (
            fiscal_year, type, voucher_no, created_at,
            debtor_id, amount_taking, creditor_id, amount_pay,
            currency_id, note, type_id, receipt_no
        ) VALUES (
            NEW.fiscal_year, 'ئاڵوگۆڕی دۆلار/صريف الدولار', NEW.voucher_no, NEW.created_at,
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
                iqd_currency_id, 'فرق سعر', NEW.type_id, NEW.voucher_no
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
                iqd_currency_id, 'فرق سعر', NEW.type_id, NEW.voucher_no
            );
        END IF;

    ELSIF NEW.exchange_type_id = 2 THEN
        INSERT INTO movement (
            fiscal_year, type, voucher_no, created_at,
            debtor_id, amount_taking, creditor_id, amount_pay,
            currency_id, note, type_id, receipt_no
        ) VALUES (
            NEW.fiscal_year, 'ئاڵوگۆڕی دۆلار/صريف الدولار', NEW.voucher_no, NEW.created_at,
            NEW.exchange_usd_id, NEW.amount_usd,
            NEW.account_id, NEW.amount_usd,
            usd_currency_id, NEW.note, NEW.type_id, NEW.voucher_no
        );

        INSERT INTO movement (
            fiscal_year, type, voucher_no, created_at,
            debtor_id, amount_taking, creditor_id, amount_pay,
            currency_id, note, type_id, receipt_no
        ) VALUES (
            NEW.fiscal_year, 'ئاڵوگۆڕی دۆلار/صريف الدولار', NEW.voucher_no, NEW.created_at,
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
                iqd_currency_id, 'فرق سعر', NEW.type_id, NEW.voucher_no
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
                iqd_currency_id, 'فرق سعر', NEW.type_id, NEW.voucher_no
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5.5 PAYMENT – Kurdish type
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

-- 5.6 RECEIPT – Kurdish type
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

-- 5.7 PAID TRANSFER – Kurdish type
CREATE OR REPLACE FUNCTION movement_after_paid_transfer()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO movement (
        fiscal_year, type, voucher_no, created_at,
        debtor_id, amount_taking, creditor_id, amount_pay,
        currency_id, note, type_id, receipt_no
    ) VALUES (
        NEW.fiscal_year, 'پارەدانی حەوالە/تسدید الحوالة', NEW.voucher_no, NEW.created_at,
        NEW.hawala_incom_id, NEW.total_transfer_to_receiver,
        NEW.account_id, NEW.total_transfer_to_receiver,
        NEW.currency_id, NEW.notes, NEW.type_id, NEW.voucher_no
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5.8 FIRST BALANCE – Kurdish type
CREATE OR REPLACE FUNCTION movement_after_first_balance()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO movement (
        fiscal_year, type, voucher_no, created_at,
        debtor_id, amount_taking, creditor_id, amount_pay,
        currency_id, note, type_id, receipt_no
    ) VALUES (
        NEW.fiscal_year, 'بەڵانسی سەرەتایی/رصید البدائي', NEW.voucher_no, NEW.created_at,
        NEW.account_id, NEW.balance,
        3000, NEW.balance,
        NEW.currency_id, NEW.note, 0, NEW.voucher_no
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;