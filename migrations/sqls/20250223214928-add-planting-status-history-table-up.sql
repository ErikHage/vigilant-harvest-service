CREATE TABLE IF NOT EXISTS planting_status_history (
  planting_history_id INTEGER UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  planting_id         VARCHAR(36) NOT NULL,
  planting_status     VARCHAR(36) NOT NULL,
  comment             TEXT,
  date_created        TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  date_modified       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,

  KEY idx_planting_status_history_planting_id ( planting_id )
);
