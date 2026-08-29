import { HarvestType, HarvestTypeResponse } from '../services/harvest-types/types';

function toResponse(harvestType: HarvestType): HarvestTypeResponse {
  return {
    harvestTypeId: harvestType.harvestTypeId,
    harvestTypeName: harvestType.harvestTypeName,
  };
}

export default {
  toResponse,
}
