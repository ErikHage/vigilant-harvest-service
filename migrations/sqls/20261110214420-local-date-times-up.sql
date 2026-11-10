-- Dates are stored as the user's own wall-clock values, with no time zone arithmetic.
--
-- A harvest is a day. It was written into date_created at midnight; now it gets a DATE column of
-- its own, and date_created goes back to being set by the database. Rows already here keep their
-- midnight date_created, which isn't a real audit time; the harvest API never returns it.
--
-- The entry dates become DATETIME, which holds what is written as it is, in any year from 1000.
-- The service has always written them through the same session time zone this migration runs
-- in, so converting from TIMESTAMP keeps exactly the values it has been reading.
--
-- Each statement commits on its own. If one fails, fix what it left by hand before restarting.
--
-- Setting date_modified to itself keeps its ON UPDATE CURRENT_TIMESTAMP from firing.

ALTER TABLE harvests
  ADD COLUMN harvest_date DATE NULL AFTER quantity;

UPDATE harvests
   SET harvest_date = DATE(date_created),
       date_modified = date_modified;

ALTER TABLE harvests
  MODIFY harvest_date DATE NOT NULL;

ALTER TABLE garden_journal
  MODIFY entry_date DATETIME NOT NULL;

ALTER TABLE garden_activity_log
  MODIFY entry_date DATETIME NOT NULL;
