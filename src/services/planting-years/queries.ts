const allPlantingYearFields: string = 'planting_year, last_frost_date, target_planting_date';

const plantingYears = {
  insert: 'INSERT into planting_years (planting_year, last_frost_date, target_planting_date) ' +
    'VALUES (?,?,?)',

  getAll: `SELECT ${allPlantingYearFields} FROM planting_years`,

  getByYear: `SELECT ${allPlantingYearFields} FROM planting_years WHERE planting_year = ?`,
};

export default {
  plantingYears,
}
