const allPlantingYearFields: string = 'planting_year';

const plantingYears = {
  insert: 'INSERT into planting_years (planting_year) VALUES (?)',
  getAll: `SELECT ${allPlantingYearFields} FROM planting_years`,
  getByYear: `SELECT ${allPlantingYearFields} FROM planting_years WHERE planting_year = ?`,
};

export default {
  plantingYears,
}
