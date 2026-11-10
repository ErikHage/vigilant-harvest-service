import { NewPlantingYear, PlantingYear, PlantingYearRow } from './types';
import mysqlUtils from '../../database/mysql-utils';

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
      lastFrostDate: mysqlUtils.dbDateStringToJsDate(row.last_frost_date, true),
      targetPlantingDate: mysqlUtils.dbDateStringToJsDate(row.target_planting_date, true),
    };
  },
};

export default {
  plantingYears,
}
