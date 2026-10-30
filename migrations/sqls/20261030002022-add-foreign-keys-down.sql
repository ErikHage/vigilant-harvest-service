/* Reverses 20261030002022-add-foreign-keys-up.sql, child tables in reverse order. Each table drops
   its foreign keys before the indexes they use. */

ALTER TABLE plants_activity_schedules
  DROP FOREIGN KEY fk_plants_activity_schedules_activity_schedules,
  DROP FOREIGN KEY fk_plants_activity_schedules_plants;
ALTER TABLE plants_activity_schedules
  DROP INDEX idx_plants_activity_schedules_activity_schedule_id;

ALTER TABLE planting_status_history
  DROP FOREIGN KEY fk_planting_status_history_plantings;

ALTER TABLE planting_planting_years
  DROP FOREIGN KEY fk_planting_planting_years_planting_years,
  DROP FOREIGN KEY fk_planting_planting_years_plantings;

ALTER TABLE garden_activity_log
  DROP FOREIGN KEY fk_garden_activity_log_planting_years;
ALTER TABLE garden_activity_log
  DROP INDEX idx_garden_activity_log_planting_year;

ALTER TABLE garden_journal
  DROP FOREIGN KEY fk_garden_journal_planting_years;
ALTER TABLE garden_journal
  DROP INDEX idx_garden_journal_planting_year;

ALTER TABLE harvests
  DROP FOREIGN KEY fk_harvests_planting_years,
  DROP FOREIGN KEY fk_harvests_plantings;
ALTER TABLE harvests
  DROP INDEX idx_harvests_planting_year,
  DROP INDEX idx_harvests_planting_id;

ALTER TABLE plantings
  DROP FOREIGN KEY fk_plantings_planting_years,
  DROP FOREIGN KEY fk_plantings_plots,
  DROP FOREIGN KEY fk_plantings_plants;
ALTER TABLE plantings
  DROP INDEX idx_plantings_current_planting_year,
  DROP INDEX idx_plantings_plot_id,
  DROP INDEX idx_plantings_plant_id;

ALTER TABLE plants
  DROP FOREIGN KEY fk_plants_plant_subcategories;
ALTER TABLE plants
  DROP INDEX idx_plants_subcategory_id;

ALTER TABLE plant_subcategories
  DROP FOREIGN KEY fk_plant_subcategories_plant_categories;
