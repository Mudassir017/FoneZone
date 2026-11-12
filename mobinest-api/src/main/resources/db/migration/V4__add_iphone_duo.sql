-- Adds Apple's first foldable, the iPhone Duo (announced 9 Sep 2026; on sale in India from 23 Oct 2026).
-- India MRP per storage from apple.com/in; specs from apple.com/in/iphone-duo/specs.
-- RAM is not published by Apple; 12 GB is the widely reported figure.
--
-- Idempotent and fresh-install safe: on an empty database the brand table is still empty here,
-- so nothing is inserted and CatalogSeeder adds the phone from seed/phones.json instead.

INSERT INTO phone (slug, brand_id, name, release_year, camera_style, five_g, discount, rating, review_count,
                   specs, highlights, tags, active)
SELECT 'iphone-duo', b.id, 'iPhone Duo', 2026, 'plateau', TRUE, 0, 0, 0,
       JSON_OBJECT(
           'display', '7.6" foldable OLED + 5.4" cover, 120Hz ProMotion',
           'processor', 'A20 Pro',
           'rearCamera', '48MP Fusion + 48MP Ultra Wide',
           'frontCamera', '12MP Center Stage',
           'battery', 'Up to 44 hrs video playback (cover screen)',
           'charging', '50% in ~20 min (60W), 25W MagSafe',
           'os', 'iOS 27',
           'weight', '254 g'),
       JSON_ARRAY('Opens from 5.4" to a 7.6" screen', 'Thinnest iPhone ever, when open', 'A20 Pro chip'),
       JSON_ARRAY('new-launch'),
       TRUE
  FROM brand b
 WHERE b.slug = 'apple'
   AND NOT EXISTS (SELECT 1 FROM phone WHERE slug = 'iphone-duo');

INSERT INTO phone_variant (phone_id, position, ram_gb, storage_gb, mrp)
SELECT p.id, v.position, 12, v.storage_gb, v.mrp
  FROM phone p
  JOIN (SELECT 0 AS position, 256 AS storage_gb, 299900.00 AS mrp
        UNION ALL SELECT 1, 512, 324900.00
        UNION ALL SELECT 2, 1024, 374900.00
        UNION ALL SELECT 3, 2048, 449900.00) v
 WHERE p.slug = 'iphone-duo'
   AND NOT EXISTS (SELECT 1 FROM phone_variant pv WHERE pv.phone_id = p.id);

INSERT INTO phone_color (phone_id, position, name, hex)
SELECT p.id, c.position, c.name, c.hex
  FROM phone p
  JOIN (SELECT 0 AS position, 'Star White' AS name, '#e8e6e1' AS hex
        UNION ALL SELECT 1, 'Night Sky', '#2a2d35') c
 WHERE p.slug = 'iphone-duo'
   AND NOT EXISTS (SELECT 1 FROM phone_color pc WHERE pc.phone_id = p.id);

-- Sold new only; price = MRP (no discount, condition factor 1). Demo stock 25 per SKU.
INSERT INTO sku (sku_code, phone_id, variant_id, color_id, condition_code, price, mrp, stock)
SELECT CONCAT('iphone-duo/', v.ram_gb, '-', v.storage_gb, '/', LOWER(REPLACE(c.name, ' ', '-')), '/new'),
       p.id, v.id, c.id, 'new', v.mrp, v.mrp, 25
  FROM phone p
  JOIN phone_variant v ON v.phone_id = p.id
  JOIN phone_color c ON c.phone_id = p.id
 WHERE p.slug = 'iphone-duo'
   AND NOT EXISTS (SELECT 1 FROM sku s WHERE s.phone_id = p.id);
