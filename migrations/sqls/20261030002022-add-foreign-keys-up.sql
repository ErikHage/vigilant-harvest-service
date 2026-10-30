/* Each ALTER TABLE adds one child table's indexes and foreign keys together, so it applies whole
   or not at all. The migration's JS refuses to run this while any orphan would break a key.

   ON DELETE CASCADE only for rows that belong to their parent: a planting's status history and
   year mappings, and the plant <-> schedule links. Everything else is a user's data, and deleting
   its parent is refused (the service answers 409). */

ALTER TABLE plant_subcategories
  ADD CONSTRAINT fk_plant_subcategories_plant_categories
    FOREIGN KEY ( category_id ) REFERENCES plant_categories ( category_id );

ALTER TABLE plants
  ADD INDEX idx_plants_subcategory_id ( subcategory_id ),
  ADD CONSTRAINT fk_plants_plant_subcategories
    FOREIGN KEY ( subcategory_id ) REFERENCES plant_subcategories ( subcategory_id );

ALTER TABLE plantings
  ADD INDEX idx_plantings_plant_id ( plant_id ),
  ADD INDEX idx_plantings_plot_id ( plot_id ),
  ADD INDEX idx_plantings_current_planting_year ( current_planting_year ),
  ADD CONSTRAINT fk_plantings_plants
    FOREIGN KEY ( plant_id ) REFERENCES plants ( plant_id ),
  ADD CONSTRAINT fk_plantings_plots
    FOREIGN KEY ( plot_id ) REFERENCES plots ( plot_id ),
  ADD CONSTRAINT fk_plantings_planting_years
    FOREIGN KEY ( current_planting_year ) REFERENCES planting_years ( planting_year );

ALTER TABLE harvests
  ADD INDEX idx_harvests_planting_id ( planting_id ),
  ADD INDEX idx_harvests_planting_year ( planting_year ),
  ADD CONSTRAINT fk_harvests_plantings
    FOREIGN KEY ( planting_id ) REFERENCES plantings ( planting_id ),
  ADD CONSTRAINT fk_harvests_planting_years
    FOREIGN KEY ( planting_year ) REFERENCES planting_years ( planting_year );

ALTER TABLE garden_journal
  ADD INDEX idx_garden_journal_planting_year ( planting_year ),
  ADD CONSTRAINT fk_garden_journal_planting_years
    FOREIGN KEY ( planting_year ) REFERENCES planting_years ( planting_year );

ALTER TABLE garden_activity_log
  ADD INDEX idx_garden_activity_log_planting_year ( planting_year ),
  ADD CONSTRAINT fk_garden_activity_log_planting_years
    FOREIGN KEY ( planting_year ) REFERENCES planting_years ( planting_year );

ALTER TABLE planting_planting_years
  ADD CONSTRAINT fk_planting_planting_years_plantings
    FOREIGN KEY ( planting_id ) REFERENCES plantings ( planting_id ) ON DELETE CASCADE,
  ADD CONSTRAINT fk_planting_planting_years_planting_years
    FOREIGN KEY ( planting_year ) REFERENCES planting_years ( planting_year );

ALTER TABLE planting_status_history
  ADD CONSTRAINT fk_planting_status_history_plantings
    FOREIGN KEY ( planting_id ) REFERENCES plantings ( planting_id ) ON DELETE CASCADE;

ALTER TABLE plants_activity_schedules
  ADD INDEX idx_plants_activity_schedules_activity_schedule_id ( activity_schedule_id ),
  ADD CONSTRAINT fk_plants_activity_schedules_plants
    FOREIGN KEY ( plant_id ) REFERENCES plants ( plant_id ) ON DELETE CASCADE,
  ADD CONSTRAINT fk_plants_activity_schedules_activity_schedules
    FOREIGN KEY ( activity_schedule_id ) REFERENCES activity_schedules ( activity_schedule_id ) ON DELETE CASCADE;
