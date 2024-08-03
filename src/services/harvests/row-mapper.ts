import { Harvest, HarvestRow, HarvestSummary, HarvestSummaryRequest, HarvestSummaryRow } from './types';

function fromRow(row: HarvestRow): Harvest {
  return {
    harvestId: row.harvest_id,
    plantingId: row.planting_id,
    quantity: row.quantity,
  }
}

const upsert = {
  toParams: (harvest: Harvest): Array<string | number> => ([
    harvest.harvestId,
    harvest.plantingId,
    harvest.quantity,
  ]),
};

const summary = {
  toParams: (request: HarvestSummaryRequest): Array<string | number> => ([
    request.plantingYear,
  ]),

  fromRow: (row: HarvestSummaryRow): HarvestSummary => ({
    plantingYear: row.planting_year,
    plantingId: row.planting_id,
    quantity: row.quantity,
  }),
};

export default {
  upsert,
  summary,
  fromRow,
}
