-- Customers (identity lives in Clerk; we keep a local profile keyed by the Clerk user id),
-- coupons and orders.

CREATE TABLE customer (
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    clerk_user_id  VARCHAR(64)  NOT NULL,
    email          VARCHAR(160),
    full_name      VARCHAR(120),
    role           VARCHAR(20)  NOT NULL DEFAULT 'CUSTOMER',   -- CUSTOMER | ADMIN
    created_at     DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at     DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uk_customer_clerk UNIQUE (clerk_user_id)
) ENGINE = InnoDB;

CREATE TABLE coupon (
    code            VARCHAR(30)   PRIMARY KEY,
    description     VARCHAR(200)  NOT NULL,
    discount_type   VARCHAR(10)   NOT NULL,               -- PERCENT | FLAT
    discount_value  DECIMAL(12,2) NOT NULL,
    max_discount    DECIMAL(12,2),
    min_subtotal    DECIMAL(12,2) NOT NULL DEFAULT 0,
    max_subtotal    DECIMAL(12,2),
    active          BOOLEAN       NOT NULL DEFAULT TRUE,
    valid_until     DATETIME(6)
) ENGINE = InnoDB;

CREATE TABLE orders (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_number        VARCHAR(24)   NOT NULL,
    customer_id         BIGINT,                           -- NULL for guest checkout
    email               VARCHAR(160)  NOT NULL,
    status              VARCHAR(20)   NOT NULL,
    payment_method      VARCHAR(20)   NOT NULL,
    payment_status      VARCHAR(20)   NOT NULL,
    payment_reference   VARCHAR(80),
    coupon_code         VARCHAR(30),
    subtotal            DECIMAL(12,2) NOT NULL,
    mrp_total           DECIMAL(12,2) NOT NULL,
    coupon_discount     DECIMAL(12,2) NOT NULL DEFAULT 0,
    shipping_fee        DECIMAL(12,2) NOT NULL DEFAULT 0,
    total               DECIMAL(12,2) NOT NULL,
    item_count          INT           NOT NULL,
    ship_full_name      VARCHAR(120)  NOT NULL,
    ship_phone          VARCHAR(15)   NOT NULL,
    ship_email          VARCHAR(160)  NOT NULL,
    ship_address        VARCHAR(255)  NOT NULL,
    ship_landmark       VARCHAR(120),
    ship_city           VARCHAR(80)   NOT NULL,
    ship_state          VARCHAR(60)   NOT NULL,
    ship_pincode        VARCHAR(6)    NOT NULL,
    estimated_delivery  DATE          NOT NULL,
    created_at          DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at          DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uk_order_number   UNIQUE (order_number),
    CONSTRAINT fk_order_customer FOREIGN KEY (customer_id) REFERENCES customer (id),
    INDEX idx_order_customer_created (customer_id, created_at)
) ENGINE = InnoDB;

-- Order lines keep a snapshot of name and price, so later catalogue changes never alter past orders.
CREATE TABLE order_item (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id         BIGINT        NOT NULL,
    item_type        VARCHAR(12)   NOT NULL,              -- PHONE | ACCESSORY
    product_slug     VARCHAR(80)   NOT NULL,
    sku_id           BIGINT,
    accessory_id     BIGINT,
    line_key         VARCHAR(200)  NOT NULL,
    name             VARCHAR(160)  NOT NULL,
    details          VARCHAR(200),
    condition_label  VARCHAR(60),
    color_name       VARCHAR(60),
    color_hex        VARCHAR(7),
    unit_price       DECIMAL(12,2) NOT NULL,
    unit_mrp         DECIMAL(12,2) NOT NULL,
    quantity         INT           NOT NULL,
    CONSTRAINT ck_item_quantity  CHECK (quantity BETWEEN 1 AND 5),
    CONSTRAINT fk_item_order     FOREIGN KEY (order_id)     REFERENCES orders (id) ON DELETE CASCADE,
    CONSTRAINT fk_item_sku       FOREIGN KEY (sku_id)       REFERENCES sku (id),
    CONSTRAINT fk_item_accessory FOREIGN KEY (accessory_id) REFERENCES accessory (id)
) ENGINE = InnoDB;

INSERT INTO coupon (code, description, discount_type, discount_value, max_discount, min_subtotal, max_subtotal) VALUES
    ('WELCOME10', '10% off your first order (up to ₹2,000)',                          'PERCENT', 10,   2000, 0,     NULL),
    ('MOBI1000',  'Flat ₹1,000 off on orders above ₹25,000',                           'FLAT',    1000, NULL, 25000, NULL),
    ('ACCESS20',  '20% off when your order is under ₹5,000 (great for accessories)',  'PERCENT', 20,   NULL, 0,     5000);
