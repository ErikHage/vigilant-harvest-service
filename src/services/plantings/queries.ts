const allPlantingFields: string = 'planting_id, plant_id, num_plants, planting_year ';

const plantings = {
  upsert: `
    INSERT into plantings (planting_id, plant_id, num_plants, planting_year) VALUES (?,?,?,?)
    ON DUPLICATE KEY
    UPDATE plant_id =   VALUES(plant_id),
           num_plants = VALUES(num_plants),
           planting_year = VALUES(planting_year)`,
  getById: `SELECT ${allPlantingFields} FROM plantings WHERE plant_id = ?`,
  getByYear: `SELECT ${allPlantingFields} FROM plantings WHERE planting_year = ?`,
  getAll: `SELECT ${allPlantingFields} FROM plantings`,
  deleteById: 'DELETE FROM plantings WHERE plant_id = ?',
};

export default {
  plantings,
}
