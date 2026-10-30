/* Rows that would break a foreign key added by 20261030002022-add-foreign-keys: one row per
   relationship, with the count of child rows whose parent is missing. Every count must be 0.
   The same report, with the queries that clear what it finds, is scripts/foreign-key-orphans.sql. */
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
