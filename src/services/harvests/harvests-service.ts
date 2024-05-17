import { Harvest, HarvestRequest } from './types';

import inMemoryDatasource from './harvests-in-memory-datasource';

async function upsertHarvest(harvestRequest: HarvestRequest): Promise<Harvest> {
  try {
    return await inMemoryDatasource.upsertHarvest(harvestRequest);
  } catch (err) {
    // log and wrap error
    throw err;
  }
}

async function getHarvestById(harvestId: string): Promise<Harvest> {
  try {
    return await inMemoryDatasource.getHarvestById(harvestId);
  } catch (err) {
    // log and wrap error
    throw err;
  }
}

async function getHarvests(): Promise<Harvest[]> {
  try {
    return await inMemoryDatasource.getHarvests();
  } catch (err) {
    // log and wrap error
    throw err;
  }
}

async function deleteHarvestById(harvestId: string): Promise<void> {
  try {
    await inMemoryDatasource.deleteHarvestById(harvestId);
  } catch (err) {
    // log and wrap error
    throw err;
  }
}

export default {
  upsertHarvest,
  getHarvestById,
  getHarvests,
  deleteHarvestById,
}
