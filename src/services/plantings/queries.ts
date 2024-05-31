const allPlantingFields: string = 'planting_id, plant_id, num_plants';
// const allPlotPlantingFields: string = 'plot_year_id, planting_id, x_coordinate, y_coordinate';

const plantings = {
  upsert: `
    INSERT into plantings (planting_id, plant_id, num_plants) VALUES (?,?,?)
    ON DUPLICATE KEY
    UPDATE plant_id =   VALUES(plant_id),
           num_plants = VALUES(num_plants)`,
  getById: `SELECT ${allPlantingFields} FROM plants WHERE plant_id = ?`,
  getAll: `SELECT ${allPlantingFields} FROM plants`,
  deleteById: 'DELETE FROM plants WHERE plant_id = ?',
};

export default {
  plantings,
}
