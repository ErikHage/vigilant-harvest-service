-- Drops every cultivar recorded since the up migration.

ALTER TABLE plants
  DROP COLUMN cultivar;
