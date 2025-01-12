START TRANSACTION;

-- details
ALTER TABLE plants ADD COLUMN category              VARCHAR(255) NOT NULL DEFAULT 'Uncategorized' AFTER plant_id;
ALTER TABLE plants ADD COLUMN seed_source           VARCHAR(255) AFTER category;
ALTER TABLE plants ADD COLUMN tags                  TEXT NOT NULL AFTER seed_source;
ALTER TABLE plants ADD COLUMN plant_description     TEXT AFTER tags;

-- starting
ALTER TABLE plants ADD COLUMN indoor_sowing          VARCHAR(255) AFTER family;
ALTER TABLE plants ADD COLUMN direct_sowing          VARCHAR(255) AFTER indoor_sowing;
ALTER TABLE plants ADD COLUMN germination_days_range VARCHAR(255) AFTER direct_sowing;
ALTER TABLE plants ADD COLUMN germination_temp_range VARCHAR(255) AFTER germination_days_range;

-- planting
ALTER TABLE plants ADD COLUMN planting_depth_inches  INT AFTER germination_temp_range;
ALTER TABLE plants ADD COLUMN plant_spacing_inches   INT AFTER planting_depth_inches;
ALTER TABLE plants ADD COLUMN row_spacing_inches     INT AFTER plant_spacing_inches;
ALTER TABLE plants ADD COLUMN planting_instructions  VARCHAR(2000) AFTER row_spacing_inches;

-- growing
ALTER TABLE plants ADD COLUMN required_sun           VARCHAR(255) AFTER planting_instructions;
ALTER TABLE plants ADD COLUMN days_to_maturity       INT AFTER required_sun;
ALTER TABLE plants ADD COLUMN is_climbing            TINYINT(1) NOT NULL DEFAULT 0 AFTER days_to_maturity;
ALTER TABLE plants ADD COLUMN climbing_height_feet   INT AFTER is_climbing;
ALTER TABLE plants ADD COLUMN plant_size             VARCHAR(255) AFTER climbing_height_feet;

-- harvest
ALTER TABLE plants ADD COLUMN fruit_size             VARCHAR(255) AFTER plant_size;
ALTER TABLE plants ADD COLUMN shelf_stability        VARCHAR(255) AFTER fruit_size;
ALTER TABLE plants ADD COLUMN harvest_instructions   VARCHAR(2000) AFTER shelf_stability;

COMMIT;
