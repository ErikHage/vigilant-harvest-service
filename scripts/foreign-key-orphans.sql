/* Orphans that block the 20261030002022-add-foreign-keys migration: rows whose parent is gone.
   Run in MySQL Workbench against vigilant_harvest -- locally, and in prod before deploying. The
   migration runs the same report at boot and refuses to start while any count is above 0.

   1. Run the REPORT. If every count is 0, stop: nothing to do.
   2. Run the PREVIEW, and look at what step 3 would delete.
   3. Run the DELETES, re-run the REPORT, then COMMIT (or ROLLBACK).

   Step 3 only deletes rows that are meaningless without their parent: a deleted planting's history,
   year mappings and harvests, and links to a deleted plant or schedule. Anything else the report
   finds (a planting, plant, subcategory, journal or log entry pointing at something missing) is
   real data -- decide case by case. A planting whose plot is gone is best fixed with
   UPDATE plantings SET plot_id = NULL WHERE planting_id = '...'. */

-- REPORT ---------------------------------------------------------------------------------------
SELECT 'plant_subcategories.category_id' AS relationship, COUNT(*) AS orphans
  FROM plant_subcategories c LEFT JOIN plant_categories p ON p.category_id = c.category_id
 WHERE p.category_id IS NULL
UNION ALL
SELECT 'plants.subcategory_id', COUNT(*)
  FROM plants c LEFT JOIN plant_subcategories p ON p.subcategory_id = c.subcategory_id
 WHERE p.subcategory_id IS NULL
UNION ALL
SELECT 'plantings.plant_id', COUNT(*)
  FROM plantings c LEFT JOIN plants p ON p.plant_id = c.plant_id
 WHERE p.plant_id IS NULL
UNION ALL
SELECT 'plantings.plot_id', COUNT(*)
  FROM plantings c LEFT JOIN plots p ON p.plot_id = c.plot_id
 WHERE c.plot_id IS NOT NULL AND p.plot_id IS NULL
UNION ALL
SELECT 'plantings.current_planting_year', COUNT(*)
  FROM plantings c LEFT JOIN planting_years p ON p.planting_year = c.current_planting_year
 WHERE p.planting_year IS NULL
UNION ALL
SELECT 'harvests.planting_id', COUNT(*)
  FROM harvests c LEFT JOIN plantings p ON p.planting_id = c.planting_id
 WHERE p.planting_id IS NULL
UNION ALL
SELECT 'harvests.planting_year', COUNT(*)
  FROM harvests c LEFT JOIN planting_years p ON p.planting_year = c.planting_year
 WHERE p.planting_year IS NULL
UNION ALL
SELECT 'garden_journal.planting_year', COUNT(*)
  FROM garden_journal c LEFT JOIN planting_years p ON p.planting_year = c.planting_year
 WHERE p.planting_year IS NULL
UNION ALL
SELECT 'garden_activity_log.planting_year', COUNT(*)
  FROM garden_activity_log c LEFT JOIN planting_years p ON p.planting_year = c.planting_year
 WHERE p.planting_year IS NULL
UNION ALL
SELECT 'planting_planting_years.planting_year', COUNT(*)
  FROM planting_planting_years c LEFT JOIN planting_years p ON p.planting_year = c.planting_year
 WHERE p.planting_year IS NULL
UNION ALL
SELECT 'planting_planting_years.planting_id', COUNT(*)
  FROM planting_planting_years c LEFT JOIN plantings p ON p.planting_id = c.planting_id
 WHERE p.planting_id IS NULL
UNION ALL
SELECT 'planting_status_history.planting_id', COUNT(*)
  FROM planting_status_history c LEFT JOIN plantings p ON p.planting_id = c.planting_id
 WHERE p.planting_id IS NULL
UNION ALL
SELECT 'plants_activity_schedules.plant_id', COUNT(*)
  FROM plants_activity_schedules c LEFT JOIN plants p ON p.plant_id = c.plant_id
 WHERE p.plant_id IS NULL
UNION ALL
SELECT 'plants_activity_schedules.activity_schedule_id', COUNT(*)
  FROM plants_activity_schedules c LEFT JOIN activity_schedules p ON p.activity_schedule_id = c.activity_schedule_id
 WHERE p.activity_schedule_id IS NULL;

-- PREVIEW: what the deletes below would remove -------------------------------------------------
SELECT c.* FROM harvests c LEFT JOIN plantings p ON p.planting_id = c.planting_id WHERE p.planting_id IS NULL;

SELECT c.planting_id, COUNT(*) AS history_rows, MIN(c.date_created) AS first, MAX(c.date_created) AS last
  FROM planting_status_history c LEFT JOIN plantings p ON p.planting_id = c.planting_id
 WHERE p.planting_id IS NULL
 GROUP BY c.planting_id;

SELECT c.* FROM planting_planting_years c LEFT JOIN plantings p ON p.planting_id = c.planting_id WHERE p.planting_id IS NULL;

SELECT c.* FROM plants_activity_schedules c
  LEFT JOIN plants pl ON pl.plant_id = c.plant_id
  LEFT JOIN activity_schedules s ON s.activity_schedule_id = c.activity_schedule_id
 WHERE pl.plant_id IS NULL OR s.activity_schedule_id IS NULL;

-- DELETES --------------------------------------------------------------------------------------
-- Workbench's safe-update mode refuses a multi-table DELETE, so it is off for these statements.
SET SQL_SAFE_UPDATES = 0;
START TRANSACTION;

DELETE c FROM harvests c
  LEFT JOIN plantings p ON p.planting_id = c.planting_id
 WHERE p.planting_id IS NULL;

DELETE c FROM planting_status_history c
  LEFT JOIN plantings p ON p.planting_id = c.planting_id
 WHERE p.planting_id IS NULL;

DELETE c FROM planting_planting_years c
  LEFT JOIN plantings p ON p.planting_id = c.planting_id
 WHERE p.planting_id IS NULL;

DELETE c FROM plants_activity_schedules c
  LEFT JOIN plants p ON p.plant_id = c.plant_id
 WHERE p.plant_id IS NULL;

DELETE c FROM plants_activity_schedules c
  LEFT JOIN activity_schedules p ON p.activity_schedule_id = c.activity_schedule_id
 WHERE p.activity_schedule_id IS NULL;

-- Re-run the REPORT above. If every count is now 0, COMMIT; if anything looks wrong, ROLLBACK.
-- COMMIT;
-- ROLLBACK;
-- SET SQL_SAFE_UPDATES = 1;
