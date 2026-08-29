START TRANSACTION;

CREATE TABLE IF NOT EXISTS harvest_types (
  harvest_type_id   INTEGER UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  harvest_type_name VARCHAR(255) NOT NULL,
  date_created      TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  date_modified     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,

  UNIQUE KEY uk_harvest_type_harvest_type_name ( harvest_type_name )
);

/* id 1 is 'unspecified' and is the column default below, so insert it explicitly */
INSERT INTO harvest_types (harvest_type_id, harvest_type_name) VALUES (1, 'unspecified');

INSERT INTO harvest_types (harvest_type_name) VALUES
  /* units of measure */
  ('count'), ('ounces'), ('pounds'), ('grams'), ('kilograms'),
  ('pints'), ('quarts'), ('bunches'), ('heads'),
  /* parts of the plant */
  ('fruit'), ('leaf'), ('root'), ('bulb'), ('seed'),
  ('flower'), ('stem'), ('pod'), ('tuber');

ALTER TABLE plants
  ADD COLUMN default_harvest_type_id INTEGER UNSIGNED NOT NULL DEFAULT 1 AFTER growing_notes,
  ADD CONSTRAINT fk_plants_default_harvest_type
    FOREIGN KEY ( default_harvest_type_id ) REFERENCES harvest_types ( harvest_type_id );

ALTER TABLE harvests
  ADD COLUMN harvest_type_id INTEGER UNSIGNED NOT NULL DEFAULT 1 AFTER planting_year,
  ADD CONSTRAINT fk_harvests_harvest_type
    FOREIGN KEY ( harvest_type_id ) REFERENCES harvest_types ( harvest_type_id );

COMMIT;
