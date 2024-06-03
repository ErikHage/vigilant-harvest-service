import { v4 } from 'uuid';

import { Harvest, HarvestRequest } from './types';

import datasource from './harvests-mysql-datasource';
import { ensureError } from '../../errors';
import { getLogger } from '../../logging';

const logger = getLogger('harvests-service');

async function upsertHarvest(harvestRequest: HarvestRequest): Promise<Harvest> {
  try {
    const harvest: Harvest = {
      harvestId: harvestRequest.harvestId || v4(),
      plantingId: harvestRequest.plantingId,
      quantity: harvestRequest.quantity,
    };

    return await datasource.upsertHarvest(harvest);
  } catch (err) {
    const error = ensureError(err);
    logger.error(error, 'Error upserting harvest');
    throw err;
  }
}

async function getHarvestById(harvestId: string): Promise<Harvest> {
  try {
    return await datasource.getHarvestById(harvestId);
  } catch (err) {
    const error = ensureError(err);
    logger.error(error, 'Error getting harvest by id %s', harvestId);
    throw err;
  }
}

// TODO change to by planting? might also need a by-year.
async function getHarvests(): Promise<Harvest[]> {
  try {
    return await datasource.getHarvests();
  } catch (err) {
    const error = ensureError(err);
    logger.error(error, 'Error getting harvests');
    throw err;
  }
}

async function deleteHarvestById(harvestId: string): Promise<void> {
  try {
    await datasource.deleteHarvestById(harvestId);
  } catch (err) {
    const error = ensureError(err);
    logger.error(error, 'Error deleting harvest by id %s', harvestId);
    throw err;
  }
}

export default {
  upsertHarvest,
  getHarvestById,
  getHarvests,
  deleteHarvestById,
}
