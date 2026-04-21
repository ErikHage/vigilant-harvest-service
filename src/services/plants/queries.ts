const allPlantFields =
`p.plant_id,
c.category_name,
c.category_id,
s.subcategory_name,
s.subcategory_id,
p.tags,
p.plant_description,
p.friendly_name,
p.lifespan_type,
p.family,
p.genus,
p.species,
p.indoor_sowing,
p.direct_sowing,
p.germination_days_range,
p.germination_temp_range,
p.sowing_notes,
p.planting_depth_inches,
p.plant_spacing_inches,
p.row_spacing_inches,
p.planting_instructions,
p.required_sun,
p.days_to_maturity,
p.is_climbing,
p.climbing_height_feet,
p.plant_size,
p.growing_notes,
p.fruit_size,
p.shelf_stability,
p.harvest_instructions,
p.date_created,
p.date_modified`;

const upsertPlant: string = `
  INSERT into plants (plant_id, subcategory_id, tags, plant_description, friendly_name, lifespan_type, family, genus, species,
  indoor_sowing, direct_sowing, germination_days_range, germination_temp_range, sowing_notes, planting_depth_inches,
  plant_spacing_inches, row_spacing_inches, planting_instructions, required_sun, days_to_maturity, is_climbing,
  climbing_height_feet, plant_size, growing_notes, fruit_size, shelf_stability, harvest_instructions)
  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  ON DUPLICATE KEY
  UPDATE subcategory_id =         VALUES(subcategory_id),
         tags =                   VALUES(tags),
         plant_description =      VALUES(plant_description),
         friendly_name =          VALUES(friendly_name),
         lifespan_type =          VALUES(lifespan_type),
         family =                 VALUES(family),
         genus =                  VALUES(genus),
         species =                VALUES(species),
         indoor_sowing =          VALUES(indoor_sowing),
         direct_sowing =          VALUES(direct_sowing),
         germination_days_range = VALUES(germination_days_range),
         germination_temp_range = VALUES(germination_temp_range),
         sowing_notes =           VALUES(sowing_notes),
         planting_depth_inches =  VALUES(planting_depth_inches),
         plant_spacing_inches =   VALUES(plant_spacing_inches),
         row_spacing_inches =     VALUES(row_spacing_inches),
         planting_instructions =  VALUES(planting_instructions),
         required_sun =           VALUES(required_sun),
         days_to_maturity =       VALUES(days_to_maturity),
         is_climbing =            VALUES(is_climbing),
         climbing_height_feet =   VALUES(climbing_height_feet),
         plant_size =             VALUES(plant_size),
         fruit_size =             VALUES(fruit_size),
         growing_notes =          VALUES(growing_notes),
         shelf_stability =        VALUES(shelf_stability),
         harvest_instructions =   VALUES(harvest_instructions)
`;

const getById: string =
  `SELECT ${allPlantFields} ` +
  '  FROM plants p' +
  '  JOIN plant_subcategories s' +
  '    ON s.subcategory_id = p.subcategory_id ' +
  '  JOIN plant_categories c' +
  '    ON c.category_id = s.category_id' +
  ' WHERE plant_id = ?';

const getByFriendlyName: string =
  `SELECT ${allPlantFields} ` +
  '  FROM plants p' +
  '  JOIN plant_subcategories s' +
  '    ON s.subcategory_id = p.subcategory_id ' +
  '  JOIN plant_categories c' +
  '    ON c.category_id = s.category_id' +
  ' WHERE friendly_name = ?';

const getAll: string =
  `SELECT ${allPlantFields} ` +
  '  FROM plants p' +
  '  JOIN plant_subcategories s' +
  '    ON s.subcategory_id = p.subcategory_id ' +
  '  JOIN plant_categories c' +
  '    ON c.category_id = s.category_id';

const deleteById: string = 'DELETE FROM plants WHERE plant_id = ?';

const categories = {
  insertCategory:
    'INSERT INTO plant_categories (category_name) VALUES (?)',

  insertSubcategory:
    'INSERT INTO plant_subcategories (subcategory_name, category_id) VALUES (?, ?)',

  getAll:
    'SELECT c.category_id, s.subcategory_id, c.category_name, s.subcategory_name ' +
    '  FROM plant_categories c ' +
    '  LEFT OUTER JOIN plant_subcategories s ' +
    '    ON c.category_id = s.category_id',
};

export default {
  upsertPlant,
  getById,
  getByFriendlyName,
  getAll,
  deleteById,

  categories,
}
