ALTER TABLE planting_years
  ADD COLUMN last_frost_date DATE NOT NULL DEFAULT '2025-01-01'
AFTER planting_year;

ALTER TABLE planting_years
  ADD COLUMN target_planting_date DATE NOT NULL DEFAULT '2025-01-01'
AFTER last_frost_date;
