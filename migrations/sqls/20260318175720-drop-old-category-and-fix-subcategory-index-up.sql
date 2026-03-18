ALTER TABLE plant_subcategories
DROP INDEX uk_plant_subcategory_subcategory_name,
    ADD UNIQUE KEY uk_plant_subcategory_category_subcategory (category_id, subcategory_name);

ALTER TABLE plants
  DROP COLUMN category;
