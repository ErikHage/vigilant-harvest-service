ALTER TABLE plants
  ADD COLUMN lifespan_type VARCHAR(25) NOT NULL DEFAULT 'annual'
  AFTER friendly_name;
