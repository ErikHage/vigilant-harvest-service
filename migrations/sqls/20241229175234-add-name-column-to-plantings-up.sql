ALTER TABLE plantings
  ADD COLUMN planting_name VARCHAR(255) NOT NULL DEFAULT '---'
  AFTER planting_year;
