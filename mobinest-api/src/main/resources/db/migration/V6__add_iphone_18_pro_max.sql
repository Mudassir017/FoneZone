-- Adds the iPhone 18 Pro Max (announced 9 Sep 2026; on sale in India from 18 Sep 2026).
-- India MRP per storage from apple.com/in (buy page); specs from apple.com/in/iphone-18-pro/specs.
-- Official finishes: Burgundy, Glacier, Silver, Black. RAM not published by Apple (12 GB reported).
-- Idempotent and fresh-install safe (see V4): the seeder adds it from seed/phones.json on a new DB.

INSERT INTO phone (slug, brand_id, name, release_year, camera_style, five_g, discount, rating, review_count,
                   specs, highlights, tags, active)
SELECT 'iphone-18-pro-max', b.id, 'iPhone 18 Pro Max', 2026, 'plateau', TRUE, 0, 0, 0,
       JSON_OBJECT(
           'display', '6.9" Super Retina XDR OLED, 120Hz ProMotion',
           'processor', 'A20 Pro',
           'rearCamera', '48MP Main (variable aperture) + 48MP Ultra Wide + 48MP 4x Telephoto',
           'frontCamera', '18MP Center Stage',
           'battery', 'Up to 43 hrs video playback',
           'charging', 'Fast wired (50% in ~15 min) & 25W MagSafe/Qi2',
           'os', 'iOS 27',
           'weight', '249 g'),
       JSON_ARRAY('48MP Main camera with variable aperture', 'A20 Pro with vapour-chamber cooling', 'Up to 43 hrs video playback'),
       JSON_ARRAY('new-launch'),
       TRUE
  FROM brand b
 WHERE b.slug = 'apple'
   AND NOT EXISTS (SELECT 1 FROM phone WHERE slug = 'iphone-18-pro-max');

INSERT INTO phone_variant (phone_id, position, ram_gb, storage_gb, mrp)
SELECT p.id, v.position, 12, v.storage_gb, v.mrp
  FROM phone p
  JOIN (SELECT 0 AS position, 256 AS storage_gb, 179900.00 AS mrp
        UNION ALL SELECT 1, 512, 204900.00
        UNION ALL SELECT 2, 1024, 254900.00
        UNION ALL SELECT 3, 2048, 329900.00) v
 WHERE p.slug = 'iphone-18-pro-max'
   AND NOT EXISTS (SELECT 1 FROM phone_variant pv WHERE pv.phone_id = p.id);

INSERT INTO phone_color (phone_id, position, name, hex)
SELECT p.id, c.position, c.name, c.hex
  FROM phone p
  JOIN (SELECT 0 AS position, 'Burgundy' AS name, '#4b2c33' AS hex
        UNION ALL SELECT 1, 'Glacier', '#a3b1c4'
        UNION ALL SELECT 2, 'Silver', '#c4c4c4'
        UNION ALL SELECT 3, 'Black', '#242424') c
 WHERE p.slug = 'iphone-18-pro-max'
   AND NOT EXISTS (SELECT 1 FROM phone_color pc WHERE pc.phone_id = p.id);

INSERT INTO sku (sku_code, phone_id, variant_id, color_id, condition_code, price, mrp, stock)
SELECT CONCAT('iphone-18-pro-max/', v.ram_gb, '-', v.storage_gb, '/', LOWER(REPLACE(c.name, ' ', '-')), '/new'),
       p.id, v.id, c.id, 'new', v.mrp, v.mrp, 25
  FROM phone p
  JOIN phone_variant v ON v.phone_id = p.id
  JOIN phone_color c ON c.phone_id = p.id
 WHERE p.slug = 'iphone-18-pro-max'
   AND NOT EXISTS (SELECT 1 FROM sku s WHERE s.phone_id = p.id);
