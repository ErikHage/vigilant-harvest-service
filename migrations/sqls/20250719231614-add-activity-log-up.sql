CREATE TABLE IF NOT EXISTS garden_activity_log (
  id            INTEGER UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  entry_id      VARCHAR(36) NOT NULL,
  planting_year INTEGER NOT NULL,
  entry_date    TIMESTAMP NOT NULL,
  activity_type VARCHAR(255) NOT NULL,
  sub_type      VARCHAR(255) NULL,
  comments      TEXT,
  date_created  TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  date_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,

  UNIQUE KEY uk_activity_log_entry_id ( entry_id ),
  KEY idx_activity_log_entry_date ( entry_date )
);
