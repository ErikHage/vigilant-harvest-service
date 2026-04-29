CREATE TABLE IF NOT EXISTS plants_activity_schedules (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `plant_id` VARCHAR(36) NOT NULL,
  `activity_schedule_id` VARCHAR(36) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_plant_id_activity_schedule_id_link` (`plant_id`, `activity_schedule_id`)
);
