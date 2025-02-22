import { Planting, PlantingRow, PlantingUpdate } from './types';
import mysqlUtils from '../../database/mysql-utils';

const plantings = {
  insert: {
    toParams: function (planting: Planting): Array<string | number | null> {
      return [
        planting.plantingId,
        planting.plantId,
        planting.plantingYear,
        planting.name,
        planting.seedSource ?? null,
        planting.lotNumber ?? null,
        planting.leadTimeWeeks ?? null,
        planting.currentStatus,
        JSON.stringify(planting.notes),
      ];
    },
  },

  update: {
    toParams: function (plantingId: string, plantingUpdate: PlantingUpdate): Array<string | number> {
      const params: Array<string | number> = [];

      params.push(plantingUpdate.status);

      if (plantingUpdate.plotId) params.push(plantingUpdate.plotId);
      if (plantingUpdate.leadTimeWeeks) params.push(plantingUpdate.leadTimeWeeks);
      if (plantingUpdate.numberSown) params.push(plantingUpdate.numberSown);
      if (plantingUpdate.sowDate) params.push(mysqlUtils.dateToDbString(plantingUpdate.sowDate));
      if (plantingUpdate.sowType) params.push(plantingUpdate.sowType);
      if (plantingUpdate.transplantDate) params.push(mysqlUtils.dateToDbString(plantingUpdate.transplantDate));
      if (plantingUpdate.numberTransplanted) params.push(plantingUpdate.numberTransplanted);

      params.push(plantingId);

      return params;
    },
  },

  upsert: {
    toParams: function (planting: Planting): Array<string | number | null> {
      return [
        planting.plantingId,
        planting.plotId ?? null,
        planting.plantId,
        planting.plantingYear,
        planting.name,
        planting.seedSource ?? null,
        planting.lotNumber ?? null,
        planting.leadTimeWeeks ?? null,
        mysqlUtils.nullableDateToDbString(planting.sowDate),
        planting.sowType ?? null,
        planting.numberSown ?? null,
        mysqlUtils.nullableDateToDbString(planting.transplantDate),
        planting.numberTransplanted ?? null,
        planting.currentStatus,
        JSON.stringify(planting.notes),
      ];
    },
  },

  fromRow: function (row: PlantingRow): Planting {
    return {
      plantingId: row.planting_id,
      plotId: row.plot_id,
      plantId: row.plant_id,
      plantingYear: row.planting_year,
      name: row.planting_name,
      seedSource: row.seed_source,
      lotNumber: row.lot_number,
      leadTimeWeeks: row.lead_time_weeks,
      sowDate: row.sow_date,
      sowType: row.sow_type,
      numberSown: row.number_sown,
      transplantDate: row.transplant_date,
      numberTransplanted: row.number_transplanted,
      currentStatus: row.current_status,
      notes: row.notes ? JSON.parse(row.notes) : [],
      dateCreated: row.date_created,
      dateModified: row.date_modified,
    };
  },
};

export default {
  plantings,
}
