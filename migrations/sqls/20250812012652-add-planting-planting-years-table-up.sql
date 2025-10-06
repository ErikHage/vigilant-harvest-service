CREATE TABLE IF NOT EXISTS planting_planting_years (
  id            INTEGER UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  planting_id   VARCHAR(36) NOT NULL,
  planting_year INTEGER NOT NULL,

  KEY idx_planting_planting_year_year (planting_year),
  UNIQUE KEY uk_planting_planting_year ( planting_id, planting_year )
);

INSERT INTO planting_planting_years (planting_id, planting_year)
SELECT planting_id, planting_year
  FROM plantings;
