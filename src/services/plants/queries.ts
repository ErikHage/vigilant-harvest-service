const allPlantFields =
`plant_id,
category,
seed_source,
tags,
plant_description,
friendly_name,
family,
genus,
species,
indoor_sowing,
direct_sowing,
germination_days_range,
germination_temp_range,
planting_depth_inches,
plant_spacing_inches,
row_spacing_inches,
planting_instructions,
required_sun,
days_to_maturity,
is_climbing,
climbing_height_feet,
plant_size,
fruit_size,
shelf_stability,
harvest_instructions,
date_created,
date_modified`;

// TODO add rest of fields to ON UPDATE clause
const upsertPlant: string = `
  INSERT into plants (plant_id, category, seed_source, tags, plant_description, friendly_name, family, genus, species,
  indoor_sowing, direct_sowing, germination_days_range, germination_temp_range, planting_depth_inches,
  plant_spacing_inches, row_spacing_inches, planting_instructions, required_sun, days_to_maturity, is_climbing,
  climbing_height_feet, plant_size, fruit_size, shelf_stability, harvest_instructions)
  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  ON DUPLICATE KEY
  UPDATE category =               VALUES(category),
         seed_source =            VALUES(seed_source),
         tags =                   VALUES(tags),
         plant_description =      VALUES(plant_description),
         friendly_name =          VALUES(friendly_name),
         family =                 VALUES(family),
         genus =                  VALUES(genus),
         species =                VALUES(species),
         indoor_sowing =          VALUES(indoor_sowing),
         direct_sowing =          VALUES(direct_sowing),
         germination_days_range = VALUES(germination_days_range),
         germination_temp_range = VALUES(germination_temp_range)
`;

const getById: string = `SELECT ${allPlantFields} FROM plants WHERE plant_id = ?`;

const getAll: string = `SELECT ${allPlantFields} FROM plants`;

const deleteById: string = 'DELETE FROM plants WHERE plant_id = ?';

export default {
  upsertPlant,
  getById,
  getAll,
  deleteById,
}
