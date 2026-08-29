START TRANSACTION;

ALTER TABLE harvests
  DROP FOREIGN KEY fk_harvests_harvest_type,
  DROP COLUMN harvest_type_id;

ALTER TABLE plants
  DROP FOREIGN KEY fk_plants_default_harvest_type,
  DROP COLUMN default_harvest_type_id;

DROP TABLE IF EXISTS harvest_types;

COMMIT;
