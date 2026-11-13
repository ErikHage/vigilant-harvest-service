-- A plant's taxonomy goes one rank further than species: the cultivar, such as 'Brandywine'.
-- Typed like species, and NULL for every plant until someone sets it.

ALTER TABLE plants
  ADD COLUMN cultivar VARCHAR(255) NULL DEFAULT NULL
  AFTER species;
