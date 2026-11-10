import {
  Harvest,
  HarvestRow,
  HarvestSearchRequest,
  HarvestSummary,
  HarvestSummaryRequest,
  HarvestSummaryRow, HarvestUpsertInstruction, HydratedHarvest, HydratedHarvestRow
} from './types';
import mysqlUtils from '../../database/mysql-utils';

function fromRow(row: HarvestRow): Harvest {
  return {
    harvestId: row.harvest_id,
    plantingId: row.planting_id,
    quantity: row.quantity,
    harvestDate: mysqlUtils.dbDateStringToJsDate(row.harvest_date, true),
    harvestTypeId: row.harvest_type_id,
    harvestType: row.harvest_type_name,
  }
}

function fromHydratedRow(row: HydratedHarvestRow): HydratedHarvest {
  return {
    harvestId: row.harvest_id,
    plantingId: row.planting_id,
    plantingName: row.planting_name,
    plantId: row.plant_id,
    plantName: row.plant_name,
    plotName: row.plot_name,
    quantity: row.quantity,
    harvestDate: mysqlUtils.dbDateStringToJsDate(row.harvest_date, true),
    harvestTypeId: row.harvest_type_id,
    harvestType: row.harvest_type_name,
  }
}

const insert = {
  toParams: (harvest: HarvestUpsertInstruction): Array<string | number> => ([
    harvest.harvestId,
    harvest.plantingId,
    harvest.plantingYear,
    harvest.quantity,
    harvest.harvestDate,
    harvest.harvestTypeId,
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
    harvestTypeId: row.harvest_type_id,
    harvestType: row.harvest_type_name,
  }),
};

const search = {
  toParams: (request: HarvestSearchRequest): Array<string | number> => ([
    request.year,
  ]),
};

const getByPlantingIdDateAndType = {
  toParams: (plantingId: string, harvestDate: string, harvestTypeId: number): Array<string | number> => ([
    plantingId,
    harvestDate,
    harvestTypeId,
  ]),
};

export default {
  insert,
  getByPlantingIdDateAndType,
  summary,
  search,
  fromRow,
  fromHydratedRow,
}
