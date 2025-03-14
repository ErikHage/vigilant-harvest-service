const allPlantFields =
`plant_id,
category,
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
sowing_notes,
planting_depth_inches,
plant_spacing_inches,
row_spacing_inches,
planting_instructions,
required_sun,
days_to_maturity,
is_climbing,
climbing_height_feet,
plant_size,
growing_notes,
fruit_size,
shelf_stability,
harvest_instructions,
date_created,
date_modified`;

const upsertPlant: string = `
  INSERT into plants (plant_id, category, tags, plant_description, friendly_name, family, genus, species,
  indoor_sowing, direct_sowing, germination_days_range, germination_temp_range, sowing_notes, planting_depth_inches,
  plant_spacing_inches, row_spacing_inches, planting_instructions, required_sun, days_to_maturity, is_climbing,
  climbing_height_feet, plant_size, growing_notes, fruit_size, shelf_stability, harvest_instructions)
  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  ON DUPLICATE KEY
  UPDATE category =               VALUES(category),
         tags =                   VALUES(tags),
         plant_description =      VALUES(plant_description),
         friendly_name =          VALUES(friendly_name),
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

const getById: string = `SELECT ${allPlantFields} FROM plants WHERE plant_id = ?`;

const getAll: string = `SELECT ${allPlantFields} FROM plants`;

const deleteById: string = 'DELETE FROM plants WHERE plant_id = ?';

export default {
  upsertPlant,
  getById,
  getAll,
  deleteById,
}
