import { HarvestType, HarvestTypeRow } from './types';

function fromRow(row: HarvestTypeRow): HarvestType {
  return {
    harvestTypeId: row.harvest_type_id,
    harvestTypeName: row.harvest_type_name,
  }
}

export default {
  fromRow,
}
