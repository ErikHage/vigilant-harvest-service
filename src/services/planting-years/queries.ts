const allPlantingYearFields: string = 'planting_year, last_frost_date, target_planting_date';

const plantingYears = {
  insert: 'INSERT into planting_years (planting_year, last_frost_date, target_planting_date) ' +
    'VALUES (?,?,?)',

  getAll: `SELECT ${allPlantingYearFields} FROM planting_years`,

  getByYear: `SELECT ${allPlantingYearFields} FROM planting_years WHERE planting_year = ?`,

  getUsage: `
    SELECT (SELECT COUNT(*) FROM plantings WHERE current_planting_year = ?) AS plantings,
           (SELECT COUNT(*) FROM planting_planting_years WHERE planting_year = ?) AS planting_mappings,
           (SELECT COUNT(*) FROM harvests WHERE planting_year = ?) AS harvests,
           (SELECT COUNT(*) FROM garden_journal WHERE planting_year = ?) AS journal_entries,
           (SELECT COUNT(*) FROM garden_activity_log WHERE planting_year = ?) AS activity_log_entries`,

  deleteByYear: 'DELETE FROM planting_years WHERE planting_year = ?',
};

export default {
  plantingYears,
}
