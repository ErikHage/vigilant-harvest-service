import { Harvest, HarvestRow, HarvestSummary, HarvestSummaryRequest, HarvestSummaryRow } from './types';
import mysqlUtils from '../../database/mysql-utils';

function fromRow(row: HarvestRow): Harvest {
  return {
    harvestId: row.harvest_id,
    plantingId: row.planting_id,
    quantity: row.quantity,
    harvestDate: row.date_created,
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

export default {
  insert,
  summary,
  fromRow,
}
