-- Back to whole numbers, rounded as MySQL rounds, and no key. The rows the up migration folded
-- stay folded: which quantities they were made of isn't kept.

UPDATE harvests
   SET quantity = ROUND(quantity),
       date_modified = date_modified;

ALTER TABLE harvests
  DROP INDEX uq_harvests_planting_date_type,
  MODIFY COLUMN quantity INT NOT NULL;
