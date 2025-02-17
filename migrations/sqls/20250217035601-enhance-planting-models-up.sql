START TRANSACTION;

ALTER TABLE plantings CHANGE COLUMN num_plants number_transplanted INTEGER UNSIGNED;

ALTER TABLE plantings
  ADD COLUMN lead_time_weeks INTEGER
AFTER plant_id;

ALTER TABLE plantings
  ADD COLUMN sow_date DATE
AFTER lead_time_weeks;

ALTER TABLE plantings
  ADD COLUMN sow_type VARCHAR(255)
AFTER sow_date;

ALTER TABLE plantings
  ADD COLUMN number_sown INTEGER UNSIGNED
 AFTER sow_type;

ALTER TABLE plantings
  ADD COLUMN transplant_date DATE
AFTER number_sown;

ALTER TABLE plantings
  ADD COLUMN current_status VARCHAR(255) NOT NULL DEFAULT 'UNKNOWN'
AFTER transplant_date;

COMMIT;
