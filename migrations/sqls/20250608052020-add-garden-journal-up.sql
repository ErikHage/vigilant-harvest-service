CREATE TABLE IF NOT EXISTS garden_journal (
  id            INTEGER UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  entry_id      VARCHAR(36) NOT NULL,
  planting_year INTEGER NOT NULL,
  entry         TEXT,
  entry_date    TIMESTAMP NOT NULL,
  date_created  TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  date_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,

  UNIQUE KEY uk_garden_journal_entry_id ( entry_id ),
  KEY idx_garden_journal_entry_date ( entry_date )
);
