import { v4 as uuidV4 } from 'uuid';

import { Harvest, HarvestRequest } from './types';

const harvestStore = new Map<string, Harvest>;

function upsertHarvest(harvestRequest: HarvestRequest): Harvest {
  const harvest: Harvest = {
    harvestId: harvestRequest.harvestId || uuidV4(),
    plantingId: harvestRequest.plantingId,
    quantity: harvestRequest.quantity,
  };

  harvestStore.set(harvest.harvestId, harvest);
  return harvest;
}

function getHarvestById(harvestId: string): Harvest {
  if (harvestStore.has(harvestId)) {
    return harvestStore.get(harvestId)!;
  }
  throw new Error(`Harvest not found with id: ${harvestId}`);
}

function getHarvests(): Harvest[] {
  return Array.from(harvestStore.values());
}

function deleteHarvestById(harvestId: string) {
  harvestStore.delete(harvestId);
}

export default {
  upsertHarvest,
  getHarvestById,
  getHarvests,
  deleteHarvestById,
}
