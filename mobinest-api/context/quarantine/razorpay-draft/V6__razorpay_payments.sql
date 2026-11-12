-- V6: Razorpay online payments.
-- Online orders now start as PENDING_PAYMENT (stock reserved) and become CONFIRMED only after the
-- payment is verified (checkout signature and/or webhook). Unpaid orders are cancelled after the
-- payment window (default 30 min) and their stock is released. COD orders are unchanged (CONFIRMED + PENDING).
-- See context/PAYMENTS.md.

ALTER TABLE orders
    ADD COLUMN payment_due_at DATETIME(6) NULL AFTER payment_reference,   -- set only while PENDING_PAYMENT
    ADD COLUMN paid_at        DATETIME(6) NULL AFTER payment_due_at,
    ADD INDEX idx_order_status_due (status, payment_due_at);

-- One row per online order: the Razorpay order we created for it and the payment that settled it.
-- Amounts are in paise (₹1 = 100), exactly as Razorpay sends them.
CREATE TABLE payment (
    id                    BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id              BIGINT        NOT NULL,
    provider              VARCHAR(20)   NOT NULL,             -- RAZORPAY
    provider_order_id     VARCHAR(40)   NOT NULL,             -- order_XXXXXXXX
    provider_payment_id   VARCHAR(40),                        -- pay_XXXXXXXX (the successful attempt)
    signature             VARCHAR(128),                       -- razorpay_signature from Checkout (already verified)
    status                VARCHAR(20)   NOT NULL,             -- PENDING | PAID | FAILED | REFUNDED
    amount_paise          BIGINT        NOT NULL,
    currency              CHAR(3)       NOT NULL DEFAULT 'INR',
    method                VARCHAR(20),                        -- upi | card | netbanking | wallet | emi ... (as reported by Razorpay)
    error_code            VARCHAR(60),                        -- last failed attempt, if any
    error_description     VARCHAR(255),
    refunded_paise        BIGINT        NOT NULL DEFAULT 0,
    last_refund_id        VARCHAR(40),
    created_at            DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at            DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uk_payment_order            UNIQUE (order_id),
    CONSTRAINT uk_payment_provider_order   UNIQUE (provider_order_id),
    CONSTRAINT uk_payment_provider_payment UNIQUE (provider_payment_id),
    CONSTRAINT fk_payment_order FOREIGN KEY (order_id) REFERENCES orders (id),
    CONSTRAINT chk_payment_amount CHECK (amount_paise >= 100)
) ENGINE = InnoDB;

-- Every verified webhook we accepted, keyed by Razorpay's x-razorpay-event-id.
-- The primary key makes processing idempotent: Razorpay delivers at least once, so duplicates are skipped.
CREATE TABLE payment_webhook_event (
    event_id              VARCHAR(64)   PRIMARY KEY,
    event_type            VARCHAR(60)   NOT NULL,             -- payment.captured, order.paid, payment.failed, refund.processed ...
    provider_order_id     VARCHAR(40),
    provider_payment_id   VARCHAR(40),
    payload               MEDIUMTEXT    NOT NULL,             -- raw body exactly as received (audit / replay)
    received_at           DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    INDEX idx_webhook_provider_order (provider_order_id)
) ENGINE = InnoDB;
