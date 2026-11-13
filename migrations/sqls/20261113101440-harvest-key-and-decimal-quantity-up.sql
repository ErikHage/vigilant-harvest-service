-- A planting holds one harvest per day per type. The service folded a new harvest into the one
-- already there, but only by reading first, so two saves at once, or two harvests in one save,
-- could still write two rows. This makes the database hold to it, and stores fractions.
--
-- 1. Fold any rows that already break the rule. Each group's quantities are added into its oldest
--    row (by date_created, then harvest_id), and the others are deleted. Prod held none on
--    2026-11-10, so this is expected to fold nothing there; it runs anyway, since a duplicate made
--    before the key exists would otherwise stop the key, and with it the service's startup.
-- 2. Add the key the folding relies on.
-- 3. Store a quantity to the hundredth: 1.5 pounds was stored as 2.

UPDATE harvests h
  JOIN (SELECT harvest_id,
               ROW_NUMBER() OVER (PARTITION BY planting_id, harvest_date, harvest_type_id
                                  ORDER BY date_created, harvest_id) AS place,
               COUNT(*) OVER (PARTITION BY planting_id, harvest_date, harvest_type_id) AS group_size,
               SUM(quantity) OVER (PARTITION BY planting_id, harvest_date, harvest_type_id) AS total
          FROM harvests) folds
    ON folds.harvest_id = h.harvest_id
   SET h.quantity = folds.total
 WHERE folds.place = 1
   AND folds.group_size > 1;

DELETE h
  FROM harvests h
  JOIN (SELECT harvest_id,
               ROW_NUMBER() OVER (PARTITION BY planting_id, harvest_date, harvest_type_id
                                  ORDER BY date_created, harvest_id) AS place
          FROM harvests) folds
    ON folds.harvest_id = h.harvest_id
 WHERE folds.place > 1;

ALTER TABLE harvests
  ADD CONSTRAINT uq_harvests_planting_date_type UNIQUE (planting_id, harvest_date, harvest_type_id),
  MODIFY COLUMN quantity DECIMAL(8,2) NOT NULL;
