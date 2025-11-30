ALTER TABLE `harvests`
  ADD COLUMN `planting_year` int NOT NULL DEFAULT (YEAR(CURRENT_TIMESTAMP)) AFTER `planting_id`;

UPDATE `harvests`
SET `planting_year` = YEAR(`date_created`);
