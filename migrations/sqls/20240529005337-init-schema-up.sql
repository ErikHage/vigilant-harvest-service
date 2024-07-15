CREATE TABLE IF NOT EXISTS plants (
  plant_id      VARCHAR(36) NOT NULL,
  friendly_name VARCHAR(255) NOT NULL,
  species       VARCHAR(255) NOT NULL,
  genus         VARCHAR(255) NOT NULL,
  family        VARCHAR(255) NOT NULL,
  date_created  TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  date_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,

  PRIMARY KEY ( plant_id ),
  UNIQUE KEY ( plant_name )
);

CREATE TABLE IF NOT EXISTS plots (
  plot_id          VARCHAR(36) NOT NULL,
  friendly_name    VARCHAR(255) NOT NULL,
  length_in_inches INTEGER NOT NULL,
  width_in_inches  INTEGER NOT NULL,
  plot_type        VARCHAR(255) NOT NULL,
  is_active        TINYINT(1) DEFAULT 1 NOT NULL,
  date_created     TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  date_modified    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,

  PRIMARY KEY ( plot_id ),
  UNIQUE KEY ( friendly_name )
);

CREATE TABLE IF NOT EXISTS harvests (
  harvest_id       VARCHAR(36) NOT NULL,
  planting_id      VARCHAR(36) NOT NULL,
  quantity         INTEGER NOT NULL,
  date_created     TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  date_modified    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,

  PRIMARY KEY ( harvest_id )
);

CREATE TABLE IF NOT EXISTS plot_years (
  plot_year_id  VARCHAR(36) NOT NULL,
  plot_id       VARCHAR(36) NOT NULL,
  num_rows      INTEGER NOT NULL,
  num_columns   INTEGER NOT NULL,
  plot_year     INTEGER NOT NULL,
  date_created  TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  date_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,

  PRIMARY KEY ( plot_year_id ),
  UNIQUE KEY ( plot_id, plot_year )
);

