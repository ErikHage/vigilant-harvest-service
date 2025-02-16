import { PlantingYear, PlantingYearRow } from './types';
import mysqlUtils from '../../database/mysql-utils';

const plantingYears = {
  insert: {
    toParams: function(plantingYear: PlantingYear): Array<string | number> {
      return [
        plantingYear.plantingYear,
        mysqlUtils.dateToDbString(plantingYear.lastFrostDate),
        mysqlUtils.dateToDbString(plantingYear.targetPlantingDate),
      ];
    },
  },

  fromRow: function(row: PlantingYearRow): PlantingYear {
    return {
      plantingYear: row.planting_year,
      lastFrostDate: row.last_frost_date,
      targetPlantingDate: row.target_planting_date,
    };
  },
};

export default {
  plantingYears,
}
