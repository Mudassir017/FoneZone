-- Storefront focus (owner, 11 Nov 2026): show only Apple, Samsung and Google Pixel for now;
-- other brands stay in the database (inactive) so they can be switched on later without re-entering data.
-- Also adds the brand "hero" phone used on the storefront's brand tiles.

ALTER TABLE brand
    ADD COLUMN active          BOOLEAN     NOT NULL DEFAULT TRUE AFTER sort_order,
    ADD COLUMN hero_phone_slug VARCHAR(80) NULL,
    ADD COLUMN hero_color      VARCHAR(60) NULL;

-- On a fresh install the brand table is still empty here (the seeder fills it afterwards
-- from seed/brands.json, which carries the same values), so these updates only affect
-- databases that were seeded before this migration.
UPDATE brand SET active = (slug IN ('apple', 'samsung', 'google'));

UPDATE brand
   SET tagline = 'iPhone 17 Pro, iPhone Air & more', hero_phone_slug = 'iphone-17-pro', hero_color = 'Cosmic Orange'
 WHERE slug = 'apple';

UPDATE brand
   SET tagline = 'Galaxy S, Z Fold, Z Flip & A series', hero_phone_slug = 'galaxy-s25-ultra', hero_color = 'Titanium Silverblue'
 WHERE slug = 'samsung';

UPDATE brand
   SET name = 'Google Pixel', tagline = 'Pixel 10 Pro, Pixel 10 & Pixel 9a', hero_phone_slug = 'pixel-10-pro', hero_color = 'Moonstone'
 WHERE slug = 'google';
