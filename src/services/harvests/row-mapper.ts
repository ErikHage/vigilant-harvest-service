import {
  Harvest,
  HarvestRow,
  HarvestSearchRequest,
  HarvestSummary,
  HarvestSummaryRequest,
  HarvestSummaryRow, HydratedHarvest, HydratedHarvestRow
} from './types';
import mysqlUtils from '../../database/mysql-utils';

function fromRow(row: HarvestRow): Harvest {
  return {
    harvestId: row.harvest_id,
    plantingId: row.planting_id,
    quantity: row.quantity,
    harvestDate: mysqlUtils.dbDateStringToJsDate(row.date_created),
  }
}

function fromHydratedRow(row: HydratedHarvestRow): HydratedHarvest {
  return {
    harvestId: row.harvest_id,
    plantingId: row.planting_id,
    plantingName: row.planting_name,
    plantId: row.plant_id,
    plantName: row.plant_name,
    quantity: row.quantity,
    harvestDate: mysqlUtils.dbDateStringToJsDate(row.date_created),
  }
}

const insert = {
  toParams: (harvest: Harvest): Array<string | number> => ([
    harvest.harvestId,
    harvest.plantingId,
    harvest.quantity,
    mysqlUtils.dateToDbString(harvest.harvestDate),
  ]),
};

const summary = {
  toParams: (request: HarvestSummaryRequest): Array<string | number> => ([
    request.plantingYear,
  ]),

  fromRow: (row: HarvestSummaryRow): HarvestSummary => ({
    plantingYear: row.planting_year,
    plantingId: row.planting_id,
    quantity: parseInt(row.quantity),
  }),
};

const search = {
  toParams: (request: HarvestSearchRequest): Array<string | number> => ([
    request.year,
  ]),
};

const getByPlantingIdAndDate = {
  toParams: (plantingId: string, harvestDate: Date): Array<string | number> => ([
    plantingId,
    mysqlUtils.dateToDbString(harvestDate),
  ]),
};

export default {
  insert,
  getByPlantingIdAndDate,
  summary,
  search,
  fromRow,
  fromHydratedRow,
}
