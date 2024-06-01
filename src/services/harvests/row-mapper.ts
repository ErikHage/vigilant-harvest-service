import { Harvest, HarvestRow } from './types';

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

export default {
  upsert,
  fromRow,
}
