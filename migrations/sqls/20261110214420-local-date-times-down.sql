-- The code before this migration reads a harvest's day from date_created, so the day is copied
-- back there, at midnight, before its column goes. Setting date_modified to itself keeps its
-- ON UPDATE CURRENT_TIMESTAMP from firing.
--
-- A TIMESTAMP holds only 1970 to 2038, so turning an entry date outside those years back into
-- one fails. That is deliberate: change or remove the entry by hand rather than lose it quietly.

UPDATE harvests
   SET date_created = harvest_date,
       date_modified = date_modified;

ALTER TABLE harvests
  DROP COLUMN harvest_date;

ALTER TABLE garden_journal
  MODIFY entry_date TIMESTAMP NOT NULL;

ALTER TABLE garden_activity_log
  MODIFY entry_date TIMESTAMP NOT NULL;
