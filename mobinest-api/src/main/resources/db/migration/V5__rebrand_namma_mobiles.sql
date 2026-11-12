-- Rebrand (12 Nov 2026): "MobiNest" -> "Namma Mobiles" in customer-visible catalogue text.
-- On a fresh install these tables are still empty here; the seeder loads the already-renamed
-- seed/*.json afterwards, so this only changes databases seeded before the rebrand.

UPDATE condition_grade
   SET warranty = REPLACE(warranty, 'MobiNest', 'Namma Mobiles')
 WHERE warranty LIKE '%MobiNest%';

UPDATE condition_grade
   SET description = REPLACE(description, 'MobiNest', 'Namma Mobiles')
 WHERE description LIKE '%MobiNest%';

UPDATE accessory
   SET brand_label = 'Namma Mobiles Essentials'
 WHERE brand_label = 'MobiNest Essentials';

UPDATE accessory
   SET description = REPLACE(description, 'MobiNest', 'Namma Mobiles')
 WHERE description LIKE '%MobiNest%';
