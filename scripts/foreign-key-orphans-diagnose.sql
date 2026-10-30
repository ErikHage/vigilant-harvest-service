/* Read-only. Explains each orphan that scripts/foreign-key-orphans.sql reports: what it was, when it
   was written, and the most likely way it was orphaned. Run before cleaning up, and use the
   likely_cause column to decide between deleting a row and repairing it. Each query returns no
   rows when its relationship has no orphans.

   Background, from the code and migrations before the 2026-10 foreign keys:
   - Until 2026-10-29 every delete removed a single row. The app's planting "Delete" button (the
     DELETE action, CREATED plantings only, since 2025-02-23) and DELETE /plantings/:id left the
     planting's status history, year mappings and harvests behind.
   - Year mappings exist only since the 2025-08-12 migration (committed 2025-10-06), which backfilled
     them from the plantings that existed then. A planting deleted before that migration ran leaves
     history orphans but no mapping orphans.
   - No write checked its parent: a harvest for any planting id, a planting for any plant or year,
     a journal or log entry for any year, a subcategory for any category.
   - harvests.planting_year was backfilled with YEAR(date_created) on 2025-11-30, and after that
     defaulted to the calendar year it was saved in, whether or not that planting year existed.
   - plants.subcategory_id was added on 2026-03-17 with DEFAULT 0. A plant never re-categorised
     since points at subcategory 0, and is hidden from GET /plants, which inner-joins subcategories.
   - The app's selected planting year falls back to the current calendar year when none is saved in
     the browser, so it can write plantings and entries into a year that was never created. */

-- 1. Deleted plantings: their leftover history, one row per planting --------------------------
SELECT h.planting_id,
       COUNT(*) AS history_rows,
       MIN(h.date_created) AS first_event,
       MAX(h.date_created) AS last_event,
       SUBSTRING_INDEX(GROUP_CONCAT(CASE WHEN h.planting_status <> 'COMMENT' THEN h.planting_status END
                                    ORDER BY h.planting_history_id), ',', -1) AS last_status,
       MAX(CASE WHEN h.planting_status = 'CREATED' AND JSON_VALID(h.comment)
                THEN JSON_UNQUOTE(JSON_EXTRACT(h.comment, '$.name')) END) AS planting_name,
       MAX(CASE WHEN h.planting_status = 'CREATED' AND JSON_VALID(h.comment)
                THEN JSON_UNQUOTE(JSON_EXTRACT(h.comment, '$.plantId')) END) AS plant_id,
       (SELECT COUNT(*) FROM planting_planting_years m WHERE m.planting_id = h.planting_id) AS year_mappings_left,
       (SELECT COUNT(*) FROM harvests x WHERE x.planting_id = h.planting_id) AS harvests_left,
       CASE
         WHEN SUBSTRING_INDEX(GROUP_CONCAT(CASE WHEN h.planting_status <> 'COMMENT' THEN h.planting_status END
                                           ORDER BY h.planting_history_id), ',', -1) = 'CREATED'
           THEN 'deleted while CREATED: the app''s Delete button (DELETE action), or DELETE /plantings/:id'
         ELSE 'deleted after it was started: only DELETE /plantings/:id or by hand, since the app''s Delete is CREATED-only'
       END AS likely_cause
  FROM planting_status_history h
  LEFT JOIN plantings p ON p.planting_id = h.planting_id
 WHERE p.planting_id IS NULL
 GROUP BY h.planting_id
 ORDER BY last_event;

-- 2. Year mappings of deleted plantings (only possible for deletes after the mappings migration) --
SELECT m.planting_id, m.planting_year,
       (SELECT COUNT(*) FROM planting_status_history s WHERE s.planting_id = m.planting_id) AS history_rows_left,
       'planting deleted after the year-mappings migration; the delete left its mappings' AS likely_cause
  FROM planting_planting_years m
  LEFT JOIN plantings p ON p.planting_id = m.planting_id
 WHERE p.planting_id IS NULL;

-- 3. Harvests whose planting is gone ---------------------------------------------------------------
SELECT h.harvest_id, h.planting_id, h.quantity, h.date_created AS harvest_date, h.date_modified AS last_saved,
       h.planting_year,
       CASE
         WHEN EXISTS (SELECT 1 FROM planting_status_history s WHERE s.planting_id = h.planting_id)
           THEN 'its planting was deleted with harvests still on it (history remains, see query 1)'
         WHEN h.planting_id REGEXP '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
           THEN 'a real-looking planting id with no history: deleted before history existed (2025-02-23), or never existed'
         ELSE 'not a planting id the service generates: written by hand or by a curl (e.g. the README example, planting "1")'
       END AS likely_cause
  FROM harvests h
  LEFT JOIN plantings p ON p.planting_id = h.planting_id
 WHERE p.planting_id IS NULL
 ORDER BY h.date_created;

-- 4. Plant <-> schedule links whose plant or schedule is gone (no timestamps on this table) -------
SELECT l.plant_id, l.activity_schedule_id,
       pl.plant_id IS NULL AS plant_missing,
       s.activity_schedule_id IS NULL AS schedule_missing,
       CASE
         WHEN pl.plant_id IS NULL THEN 'plant deleted (DELETE /plants/:id; the app never calls it) before deletes removed links'
         ELSE 'assigned with an unknown schedule id (schedules could not be deleted before 2026-10-29)'
       END AS likely_cause
  FROM plants_activity_schedules l
  LEFT JOIN plants pl ON pl.plant_id = l.plant_id
  LEFT JOIN activity_schedules s ON s.activity_schedule_id = l.activity_schedule_id
 WHERE pl.plant_id IS NULL OR s.activity_schedule_id IS NULL;

-- 5. Real data pointing at a missing planting year. Repair, don't delete: create the year ----------
SELECT 'plantings.current_planting_year' AS relationship, c.current_planting_year AS missing_year, COUNT(*) AS n_rows,
       MIN(c.date_created) AS first_written, MAX(c.date_created) AS last_written
  FROM plantings c LEFT JOIN planting_years y ON y.planting_year = c.current_planting_year
 WHERE y.planting_year IS NULL GROUP BY c.current_planting_year
UNION ALL
SELECT 'harvests.planting_year', c.planting_year, COUNT(*), MIN(c.date_modified), MAX(c.date_modified)
  FROM harvests c LEFT JOIN planting_years y ON y.planting_year = c.planting_year
 WHERE y.planting_year IS NULL GROUP BY c.planting_year
UNION ALL
SELECT 'garden_journal.planting_year', c.planting_year, COUNT(*), MIN(c.date_created), MAX(c.date_created)
  FROM garden_journal c LEFT JOIN planting_years y ON y.planting_year = c.planting_year
 WHERE y.planting_year IS NULL GROUP BY c.planting_year
UNION ALL
SELECT 'garden_activity_log.planting_year', c.planting_year, COUNT(*), MIN(c.date_created), MAX(c.date_created)
  FROM garden_activity_log c LEFT JOIN planting_years y ON y.planting_year = c.planting_year
 WHERE y.planting_year IS NULL GROUP BY c.planting_year
UNION ALL
SELECT 'planting_planting_years.planting_year', c.planting_year, COUNT(*), NULL, NULL
  FROM planting_planting_years c LEFT JOIN planting_years y ON y.planting_year = c.planting_year
 WHERE y.planting_year IS NULL GROUP BY c.planting_year
 ORDER BY missing_year, relationship;
/* likely causes: the year was never created with PUT /planting-years. Plantings, journal and log
   entries: the app fell back to the calendar year. Harvests saved before 2025-11-30: the migration
   backfilled YEAR(date_created). Harvests saved after: the column default, the calendar year at save.
   Repair with INSERT INTO planting_years (planting_year, last_frost_date, target_planting_date)
   VALUES (<year>, '<year>-05-01', '<year>-05-15');  -- use your real dates */

-- 6. Plants whose subcategory is gone. Repair, don't delete: these are plants, likely with plantings --
SELECT pl.plant_id, pl.friendly_name, pl.subcategory_id, pl.date_created, pl.date_modified,
       (SELECT COUNT(*) FROM plantings x WHERE x.plant_id = pl.plant_id) AS plantings,
       CASE
         WHEN pl.subcategory_id = 0 THEN 'never re-categorised since the 2026-03-17 migration (DEFAULT 0); hidden from GET /plants'
         ELSE 'saved with an unknown subcategory id (the insert succeeded, the read-back failed with a 500)'
       END AS likely_cause
  FROM plants pl
  LEFT JOIN plant_subcategories s ON s.subcategory_id = pl.subcategory_id
 WHERE s.subcategory_id IS NULL;
/* Repair with UPDATE plants SET subcategory_id = <id> WHERE plant_id = '...';
   pick <id> from: SELECT c.category_name, s.subcategory_id, s.subcategory_name FROM plant_subcategories s
                   JOIN plant_categories c ON c.category_id = s.category_id ORDER BY 1, 3; */

-- 7. Other real data pointing at a missing parent ------------------------------------------------
SELECT 'plantings.plant_id' AS relationship, c.planting_id AS row_id, c.planting_name AS name, c.plant_id AS missing_parent,
       c.current_status AS status, c.date_created,
       'plant deleted while it had plantings (DELETE /plants/:id, not reachable from the app), or created/updated with an unknown plantId' AS likely_cause
  FROM plantings c LEFT JOIN plants p ON p.plant_id = c.plant_id WHERE p.plant_id IS NULL
UNION ALL
SELECT 'plantings.plot_id', c.planting_id, c.planting_name, c.plot_id, c.current_status, c.date_created,
       'plot deleted while plantings were in it (DELETE /plots/:id, not in the app), or PLANT/update with an unknown plotId; repair with plot_id = NULL'
  FROM plantings c LEFT JOIN plots p ON p.plot_id = c.plot_id WHERE c.plot_id IS NOT NULL AND p.plot_id IS NULL
UNION ALL
SELECT 'plant_subcategories.category_id', CAST(c.subcategory_id AS CHAR) COLLATE utf8mb4_0900_ai_ci, c.subcategory_name, CAST(c.category_id AS CHAR) COLLATE utf8mb4_0900_ai_ci, NULL, c.date_created,
       'subcategory created under an unknown category id (categories could not be deleted before 2026-10-29)'
  FROM plant_subcategories c LEFT JOIN plant_categories p ON p.category_id = c.category_id WHERE p.category_id IS NULL;
