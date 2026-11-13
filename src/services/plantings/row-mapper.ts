import {
  Planting,
  PlantingPlantingYearRow,
  PlantingRow,
  PlantingStatusHistoryRecord,
  PlantingStatusHistoryRow,
  PlantingUpdate
} from './types';
import { PlantingsBreakdown, PlantingsBreakdownRow } from '../planting-years/types';

import mysqlUtils from '../../database/mysql-utils';
import constants from '../../util/constants';
import { PlanningPlanting, PlanningPlantingRow } from '../planning/types';

const plantings = {
  insert: {
    toParams: function (planting: Planting): Array<string | number | null> {
      return [
        planting.plantingId,
        planting.plantId,
        planting.currentPlantingYear,
        planting.name,
        planting.seedSource ?? null,
        planting.lotNumber ?? null,
        planting.targetPlantingDate ?? null,
        planting.leadTimeWeeks ?? null,
        planting.currentStatus,
        planting.notes ?? null,
      ];
    },
  },

  update: {
    /**
     * The columns an update writes, each with its value: every field that was
     * given, 0 included. A null empties its column.
     */
    toColumns: function (plantingUpdate: PlantingUpdate): Array<[ string, string | number | null ]> {
      const columns: Array<[ string, string | number | null | undefined ]> = [
        [ 'current_status', plantingUpdate.status, ],
        [ 'planting_name', plantingUpdate.name, ],
        [ 'plant_id', plantingUpdate.plantId, ],
        [ 'seed_source', plantingUpdate.seedSource, ],
        [ 'lot_number', plantingUpdate.lotNumber, ],
        [ 'plot_id', plantingUpdate.plotId, ],
        [ 'target_planting_date', plantingUpdate.targetPlantingDate, ],
        [ 'lead_time_weeks', plantingUpdate.leadTimeWeeks, ],
        [ 'number_sown', plantingUpdate.numberSown, ],
        [ 'sow_date', plantingUpdate.sowDate, ],
        [ 'sow_type', plantingUpdate.sowType, ],
        [ 'transplant_date', plantingUpdate.transplantDate, ],
        [ 'number_transplanted', plantingUpdate.numberTransplanted, ],
        [ 'notes', plantingUpdate.notes, ],
      ];

      return columns.filter((column): column is [ string, string | number | null ] => column[1] !== undefined);
    },
  },

  breakdown: {
    fromRows: (rows: PlantingsBreakdownRow[]): Map<number, PlantingsBreakdown> => {
      return rows.reduce((acc, row) => {
        if (!acc.has(row.planting_year)) {
          acc.set(row.planting_year, {
            numberCreated: 0,
            numberStarted: 0,
            numberPlanted: 0,
            numberRetired: 0,
          });
        }

        switch (row.planting_status) {
          case constants.plantings.statuses.created:
            acc.get(row.planting_year)!.numberCreated += row.status_count;
            break;
          case constants.plantings.statuses.started:
            acc.get(row.planting_year)!.numberStarted += row.status_count;
            break;
          case constants.plantings.statuses.planted:
            acc.get(row.planting_year)!.numberPlanted += row.status_count;
            break;
          case constants.plantings.statuses.retired:
            acc.get(row.planting_year)!.numberRetired += row.status_count;
            break;
        }

        return acc;
      }, new Map<number, PlantingsBreakdown>());
    },
  },

  planning: {
    fromRow: function (row: PlanningPlantingRow): PlanningPlanting {
      return {
        plantingId: row.planting_id,
        plantingName: row.planting_name,
        plantId: row.plant_id,
        plantName: row.plant_name,
        currentStatus: row.current_status,
        targetPlantingDate: row.target_planting_date ?? undefined,
        leadTimeDays: row.lead_time_weeks ? row.lead_time_weeks * 7 : undefined,
      };
    },
  },

  fromRow: function (
    row: PlantingRow,
    historyRows: PlantingStatusHistoryRow[] | undefined,
    plantingYears: PlantingPlantingYearRow[] | undefined): Planting
  {
    return {
      plantingId: row.planting_id,
      plotId: row.plot_id,
      plantId: row.plant_id,
      currentPlantingYear: row.current_planting_year,
      plantingYears: plantingYears?.map(yearRow => yearRow.planting_year) ?? [ row.planting_year, ],
      name: row.planting_name,
      seedSource: row.seed_source,
      lotNumber: row.lot_number,
      targetPlantingDate: row.target_planting_date,
      leadTimeWeeks: row.lead_time_weeks,
      sowDate: row.sow_date,
      sowType: row.sow_type,
      numberSown: row.number_sown,
      transplantDate: row.transplant_date,
      numberTransplanted: row.number_transplanted,
      currentStatus: row.current_status,
      notes: row.notes,
      dateCreated: mysqlUtils.toApiAuditTimestamp(row.date_created),
      dateModified: mysqlUtils.toApiAuditTimestamp(row.date_modified),
      statusHistory: historyRows?.map(plantingStatusHistory.fromRow),
    };
  },
};

const yearMapping = {
  insert: {
    toParams: function (planting: Planting): Array<string | number> {
      return [
        planting.plantingId,
        planting.currentPlantingYear,
      ];
    },
  },
};

const plantingStatusHistory = {
  insert: {
    toParams: function (plantingId: string, status: string, comment: string): Array<string> {
      return [
        plantingId,
        status,
        comment,
      ];
    },
  },

  fromRow: function (row: PlantingStatusHistoryRow): PlantingStatusHistoryRecord {
    return {
      plantingHistoryId: row.planting_history_id,
      plantingId: row.planting_id,
      plantingStatus: row.planting_status,
      comment: row.comment,
      dateCreated: mysqlUtils.toApiAuditTimestamp(row.date_created),
      dateModified: mysqlUtils.toApiAuditTimestamp(row.date_modified),
    };
  },
};

export default {
  plantings,
  yearMapping,
  plantingStatusHistory,
}
