CREATE TABLE IF NOT EXISTS `activity_schedules` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `activity_schedule_id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` TEXT,
  `date_created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `date_modified` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_activity_schedule_activity_schedule_id` (`activity_schedule_id`)
);

CREATE TABLE IF NOT EXISTS `activity_schedule_items` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `activity_schedule_id` varchar(36) NOT NULL,
  `entry_id` varchar(36) NOT NULL,
  `activity_type` varchar(255) NOT NULL,
  `sub_type` varchar(255) DEFAULT NULL,
  `recurrence_rule` varchar(255) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `notes` text,
  `date_created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `date_modified` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_schedule_item_activity_schedule_id` (`entry_id`),
  KEY `idx_schedule_item_activity_schedule_id` (`activity_schedule_id`),
  CONSTRAINT `fk_schedule_item_schedule` FOREIGN KEY (`activity_schedule_id`) REFERENCES `activity_schedules` (`activity_schedule_id`) ON DELETE CASCADE
);
