START TRANSACTION;

ALTER TABLE plantings
  ADD COLUMN seed_source VARCHAR(255)
  AFTER planting_name;

ALTER TABLE plants DROP COLUMN seed_source;

COMMIT;
