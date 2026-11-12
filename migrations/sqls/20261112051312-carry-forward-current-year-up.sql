-- Carrying a planting into a new year added the year to planting_planting_years, but left
-- plantings.current_planting_year on the year before. A new harvest is filed under the current
-- year, and the years' counts go by it, so a carried planting's harvests went to the year before.
-- The service now moves the current year as it carries. This moves it for plantings already
-- carried: each one's current year becomes the latest year it's mapped to, where that's later.
--
-- A planting whose current year is ahead of its mappings is left alone: this only moves forward.
-- Harvests already filed under the year before stay there; which year was meant isn't known.
--
-- Setting date_modified to itself keeps its ON UPDATE CURRENT_TIMESTAMP from firing.

UPDATE plantings p
  JOIN (SELECT planting_id, MAX(planting_year) AS latest_year
          FROM planting_planting_years
         GROUP BY planting_id) y
    ON y.planting_id = p.planting_id
   SET p.current_planting_year = y.latest_year,
       p.date_modified = p.date_modified
 WHERE p.current_planting_year < y.latest_year;
