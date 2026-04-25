ALTER TABLE `activity_schedule_items`
  MODIFY COLUMN `start_date` varchar(5) DEFAULT NULL,
  MODIFY COLUMN `end_date` varchar(5) DEFAULT NULL,
  ADD COLUMN `start_date_year_offset` tinyint NOT NULL DEFAULT 0 AFTER `start_date`,
  ADD COLUMN `end_date_year_offset` tinyint NOT NULL DEFAULT 0 AFTER `end_date`;
