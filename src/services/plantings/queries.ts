const allPlantingFields: string = 'planting_id, plot_id, plant_id, num_plants, planting_year, planting_name, notes ';

const plantings = {
  upsert: `
    INSERT into plantings (planting_id, plot_id, plant_id, num_plants, planting_year, planting_name, notes) VALUES (?,?,?,?,?,?,?)
    ON DUPLICATE KEY
    UPDATE plot_id = VALUES(plot_id),
           plant_id = VALUES(plant_id),
           num_plants = VALUES(num_plants),
           planting_year = VALUES(planting_year),
           planting_name = VALUES(planting_name),
           notes = VALUES(notes)`,
  getById: `SELECT ${allPlantingFields} FROM plantings WHERE plant_id = ?`,
  getByYear: `SELECT ${allPlantingFields} FROM plantings WHERE planting_year = ?`,
  getAll: `SELECT ${allPlantingFields} FROM plantings`,
  deleteById: 'DELETE FROM plantings WHERE plant_id = ?',
};

export default {
  plantings,
}
