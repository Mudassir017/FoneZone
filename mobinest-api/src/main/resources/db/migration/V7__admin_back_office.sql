-- Admin back office (12 Nov 2026).
-- 1. order_status_history: every status / payment-status change made by an admin (who, when, from, to, note).
-- 2. admin_audit_log: append-only log of every change made through /api/admin/** (catalogue, coupons, roles, orders).
-- 3. Indexes for the admin filters (orders by date/status, low-stock SKUs).
--
-- Admin access itself needs no schema change: customer.role ('CUSTOMER' | 'ADMIN') exists since V2.
-- To make someone an admin (see context/ADMIN.md):
--   UPDATE customer SET role = 'ADMIN' WHERE clerk_user_id = 'user_...';
-- or list their Clerk user id in ADMIN_CLERK_USER_IDS (mobinest.admin.clerk-user-ids).

CREATE TABLE order_status_history (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id         BIGINT        NOT NULL,
    kind             VARCHAR(12)   NOT NULL,              -- STATUS | PAYMENT
    from_value       VARCHAR(20),
    to_value         VARCHAR(20)   NOT NULL,
    note             VARCHAR(500),
    changed_by       VARCHAR(64)   NOT NULL,              -- Clerk user id of the admin
    changed_by_name  VARCHAR(160),                        -- email/name snapshot for display
    created_at       DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_osh_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
    INDEX idx_osh_order_created (order_id, created_at)
) ENGINE = InnoDB;

CREATE TABLE admin_audit_log (
    id                   BIGINT AUTO_INCREMENT PRIMARY KEY,
    actor_clerk_user_id  VARCHAR(64)   NOT NULL,
    actor_name           VARCHAR(160),
    action               VARCHAR(40)   NOT NULL,          -- ORDER_STATUS, SKU_UPDATE, COUPON_CREATE, ROLE_CHANGE...
    entity_type          VARCHAR(30)   NOT NULL,          -- ORDER, BRAND, PHONE, SKU, ACCESSORY, COUPON, CUSTOMER
    entity_id            VARCHAR(160)  NOT NULL,
    details              VARCHAR(1000),
    created_at           DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    INDEX idx_audit_created (created_at),
    INDEX idx_audit_entity (entity_type, entity_id)
) ENGINE = InnoDB;

CREATE INDEX idx_order_created        ON orders (created_at);
CREATE INDEX idx_order_status_created ON orders (status, created_at);
CREATE INDEX idx_sku_stock            ON sku (stock);
