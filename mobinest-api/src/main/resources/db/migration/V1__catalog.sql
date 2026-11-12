-- Catalogue: brands, buying conditions, phones (variant x colour x condition = SKU) and accessories.
-- Money is DECIMAL(12,2) in INR.

CREATE TABLE brand (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    slug        VARCHAR(40)  NOT NULL,
    name        VARCHAR(80)  NOT NULL,
    tagline     VARCHAR(160),
    accent_hex  VARCHAR(7),
    sort_order  INT          NOT NULL DEFAULT 0,
    CONSTRAINT uk_brand_slug UNIQUE (slug)
) ENGINE = InnoDB;

CREATE TABLE condition_grade (
    code          VARCHAR(20)  PRIMARY KEY,           -- new | refurbished | used | recycled
    label         VARCHAR(60)  NOT NULL,
    short_label   VARCHAR(30)  NOT NULL,
    price_factor  DECIMAL(4,3) NOT NULL,
    warranty      VARCHAR(120) NOT NULL,
    description   VARCHAR(400),
    color_hex     VARCHAR(7),
    sort_order    INT          NOT NULL DEFAULT 0
) ENGINE = InnoDB;

CREATE TABLE phone (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    slug          VARCHAR(80)  NOT NULL,
    brand_id      BIGINT       NOT NULL,
    name          VARCHAR(120) NOT NULL,
    release_year  INT,
    camera_style  VARCHAR(30),
    five_g        BOOLEAN      NOT NULL DEFAULT TRUE,
    discount      DECIMAL(4,3) NOT NULL DEFAULT 0,     -- 0.120 = 12% off the launch price
    rating        DECIMAL(2,1) NOT NULL DEFAULT 0,
    review_count  INT          NOT NULL DEFAULT 0,
    specs         JSON,
    highlights    JSON,
    tags          JSON,
    active        BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at    DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uk_phone_slug  UNIQUE (slug),
    CONSTRAINT fk_phone_brand FOREIGN KEY (brand_id) REFERENCES brand (id)
) ENGINE = InnoDB;

CREATE TABLE phone_variant (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    phone_id    BIGINT        NOT NULL,
    position    INT           NOT NULL,               -- 0 = cheapest variant
    ram_gb      INT           NOT NULL,
    storage_gb  INT           NOT NULL,
    mrp         DECIMAL(12,2) NOT NULL,               -- launch price
    CONSTRAINT uk_variant_position UNIQUE (phone_id, position),
    CONSTRAINT fk_variant_phone FOREIGN KEY (phone_id) REFERENCES phone (id) ON DELETE CASCADE
) ENGINE = InnoDB;

CREATE TABLE phone_color (
    id        BIGINT AUTO_INCREMENT PRIMARY KEY,
    phone_id  BIGINT      NOT NULL,
    position  INT         NOT NULL,
    name      VARCHAR(60) NOT NULL,
    hex       VARCHAR(7)  NOT NULL,
    CONSTRAINT uk_color_name UNIQUE (phone_id, name),
    CONSTRAINT fk_color_phone FOREIGN KEY (phone_id) REFERENCES phone (id) ON DELETE CASCADE
) ENGINE = InnoDB;

-- The unit a customer actually buys: phone + variant + colour + condition, with its own price and stock.
CREATE TABLE sku (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    sku_code        VARCHAR(160)  NOT NULL,
    phone_id        BIGINT        NOT NULL,
    variant_id      BIGINT        NOT NULL,
    color_id        BIGINT        NOT NULL,
    condition_code  VARCHAR(20)   NOT NULL,
    price           DECIMAL(12,2) NOT NULL,
    mrp             DECIMAL(12,2) NOT NULL,
    stock           INT           NOT NULL DEFAULT 0,
    CONSTRAINT uk_sku_code      UNIQUE (sku_code),
    CONSTRAINT uk_sku_selection UNIQUE (variant_id, color_id, condition_code),
    CONSTRAINT ck_sku_stock     CHECK (stock >= 0),
    CONSTRAINT fk_sku_phone     FOREIGN KEY (phone_id)       REFERENCES phone (id) ON DELETE CASCADE,
    CONSTRAINT fk_sku_variant   FOREIGN KEY (variant_id)     REFERENCES phone_variant (id) ON DELETE CASCADE,
    CONSTRAINT fk_sku_color     FOREIGN KEY (color_id)       REFERENCES phone_color (id) ON DELETE CASCADE,
    CONSTRAINT fk_sku_condition FOREIGN KEY (condition_code) REFERENCES condition_grade (code)
) ENGINE = InnoDB;

CREATE TABLE accessory_category (
    code        VARCHAR(30) PRIMARY KEY,
    name        VARCHAR(80) NOT NULL,
    icon        VARCHAR(30),
    sort_order  INT         NOT NULL DEFAULT 0
) ENGINE = InnoDB;

CREATE TABLE accessory (
    id                 BIGINT AUTO_INCREMENT PRIMARY KEY,
    slug               VARCHAR(80)   NOT NULL,
    name               VARCHAR(120)  NOT NULL,
    brand_label        VARCHAR(80)   NOT NULL,
    category_code      VARCHAR(30)   NOT NULL,
    price              DECIMAL(12,2) NOT NULL,
    mrp                DECIMAL(12,2) NOT NULL,
    rating             DECIMAL(2,1)  NOT NULL DEFAULT 0,
    review_count       INT           NOT NULL DEFAULT 0,
    description        VARCHAR(600),
    features           JSON,
    colors             JSON,
    compatible_brands  JSON,                           -- brand slugs, or ["all"]
    stock              INT           NOT NULL DEFAULT 0,
    active             BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at         DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at         DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uk_accessory_slug     UNIQUE (slug),
    CONSTRAINT ck_accessory_stock    CHECK (stock >= 0),
    CONSTRAINT fk_accessory_category FOREIGN KEY (category_code) REFERENCES accessory_category (code)
) ENGINE = InnoDB;
