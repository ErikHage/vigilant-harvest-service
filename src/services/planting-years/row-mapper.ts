import { NewPlantingYear, PlantingYear, PlantingYearRow } from './types';

const plantingYears = {
  insert: {
    toParams: function(plantingYear: NewPlantingYear): Array<string | number> {
      return [
        plantingYear.plantingYear,
        plantingYear.lastFrostDate,
        plantingYear.targetPlantingDate,
      ];
    },
  },

  fromRow: function(row: PlantingYearRow): PlantingYear {
    return {
      plantingYear: row.planting_year,
      // DATE columns: YYYY-MM-DD, as they were sent
      lastFrostDate: row.last_frost_date,
      targetPlantingDate: row.target_planting_date,
    };
  },
};

export default {
  plantingYears,
}
