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
p.cultivar,
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
p.default_harvest_type_id,
ht.harvest_type_name AS default_harvest_type_name,
p.fruit_size,
p.shelf_stability,
p.harvest_instructions,
p.date_created,
p.date_modified`;

// In the order plants' row mapper gives the params.
const plantColumns: string[] = [
  'plant_id', 'subcategory_id', 'tags', 'plant_description', 'friendly_name', 'lifespan_type', 'family', 'genus',
  'species', 'cultivar', 'indoor_sowing', 'direct_sowing', 'germination_days_range', 'germination_temp_range', 'sowing_notes',
  'planting_depth_inches', 'plant_spacing_inches', 'row_spacing_inches', 'planting_instructions', 'required_sun',
  'days_to_maturity', 'is_climbing', 'climbing_height_feet', 'plant_size', 'growing_notes', 'default_harvest_type_id',
  'fruit_size', 'shelf_stability', 'harvest_instructions',
];

// A new plant. A name another plant holds is a duplicate entry, never an overwrite.
const insertPlant: string =
  `INSERT INTO plants (${plantColumns.join(', ')})
   VALUES (${plantColumns.map(() => '?').join(', ')})`;

// An existing plant, by its id: every column but the id, then the id.
const updatePlant: string =
  `UPDATE plants
      SET ${plantColumns.slice(1).map(column => `${column} = ?`).join(',\n          ')}
    WHERE plant_id = ?`;

const countById: string = 'SELECT COUNT(*) AS count FROM plants WHERE plant_id = ?';

const assignSchedule =
  'INSERT INTO plants_activity_schedules (plant_id, activity_schedule_id) ' +
  'VALUES (?, ?)';

const unassignSchedule =
  'DELETE FROM plants_activity_schedules ' +
  ' WHERE plant_id = ? ' +
  '   AND activity_schedule_id = ?';

const getById: string =
  `SELECT ${allPlantFields} ` +
  '  FROM plants p' +
  '  JOIN plant_subcategories s' +
  '    ON s.subcategory_id = p.subcategory_id ' +
  '  JOIN plant_categories c' +
  '    ON c.category_id = s.category_id' +
  '  JOIN harvest_types ht' +
  '    ON ht.harvest_type_id = p.default_harvest_type_id' +
  ' WHERE plant_id = ?';

const getByFriendlyName: string =
  `SELECT ${allPlantFields} ` +
  '  FROM plants p' +
  '  JOIN plant_subcategories s' +
  '    ON s.subcategory_id = p.subcategory_id ' +
  '  JOIN plant_categories c' +
  '    ON c.category_id = s.category_id' +
  '  JOIN harvest_types ht' +
  '    ON ht.harvest_type_id = p.default_harvest_type_id' +
  ' WHERE friendly_name = ?';

const getAll: string =
  `SELECT ${allPlantFields} ` +
  '  FROM plants p' +
  '  JOIN plant_subcategories s' +
  '    ON s.subcategory_id = p.subcategory_id ' +
  '  JOIN plant_categories c' +
  '    ON c.category_id = s.category_id' +
  '  JOIN harvest_types ht' +
  '    ON ht.harvest_type_id = p.default_harvest_type_id';

const getSchedulesByPlantId: string =
  'SELECT s.activity_schedule_id, s.name, s.description ' +
  '  FROM plants_activity_schedules ps ' +
  '  JOIN activity_schedules s ' +
  '    ON ps.activity_schedule_id = s.activity_schedule_id ' +
  ' WHERE ps.plant_id = ?';

const countPlantingsByPlantId: string = 'SELECT COUNT(*) AS count FROM plantings WHERE plant_id = ?';

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

  countSubcategoriesByCategoryId:
    'SELECT COUNT(*) AS count FROM plant_subcategories WHERE category_id = ?',

  countPlantsBySubcategoryId:
    'SELECT COUNT(*) AS count FROM plants WHERE subcategory_id = ?',

  deleteCategoryById:
    'DELETE FROM plant_categories WHERE category_id = ?',

  deleteSubcategoryById:
    'DELETE FROM plant_subcategories WHERE category_id = ? AND subcategory_id = ?',
};

export default {
  insertPlant,
  updatePlant,
  countById,
  assignSchedule,
  unassignSchedule,

  getById,
  getByFriendlyName,
  getAll,
  getSchedulesByPlantId,
  countPlantingsByPlantId,

  deleteById,

  categories,
}
