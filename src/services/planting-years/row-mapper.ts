import { PlantingYear, PlantingYearRow } from './types';

const plantingYears = {
  upsert: {
    toParams: function(plantingYear: PlantingYear): Array<string | number> {
      return [
        plantingYear.plantingYear,
      ];
    },
  },

  fromRow: function(row: PlantingYearRow): PlantingYear {
    return {
      plantingYear: row.planting_year,
    };
  },
};

export default {
  plantingYears,
}
