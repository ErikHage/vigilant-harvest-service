import { v4 } from 'uuid';

import { Harvest, HarvestRequest, HarvestSearchRequest, HarvestSummary, HarvestSummaryRequest } from './types';

import datasource from './harvests-mysql-datasource';
import { ensureError } from '../../errors';
import { getLogger } from '../../logging';

const logger = getLogger('harvests-service');

async function insertHarvests(harvestRequests: HarvestRequest[]): Promise<Harvest[]> {
  try {
    const harvests: Harvest[] = harvestRequests.map(harvestRequest => ({
      harvestId: v4(),
      plantingId: harvestRequest.plantingId,
      quantity: harvestRequest.quantity,
      harvestDate: harvestRequest.harvestDate,
    }));

    return await datasource.insertHarvests(harvests);
  } catch (err) {
    const error = ensureError(err);
    logger.error(error, 'Error inserting harvests');
    throw err;
  }
}

async function getHarvestSummary(request: HarvestSummaryRequest): Promise<HarvestSummary[]> {
  try {
    return await datasource.getHarvestSummary(request);
  } catch (err) {
    const error = ensureError(err);
    logger.error(error, 'Error getting harvest summary', { request, });
    throw err;
  }
}

async function searchHarvests(request: HarvestSearchRequest): Promise<Harvest[]> {
  try {
    return await datasource.searchHarvests(request);
  } catch (err) {
    const error = ensureError(err);
    logger.error(error, 'Error searching harvests', { request, });
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
  insertHarvests,
  getHarvestSummary,
  deleteHarvestById,
  searchHarvests,
}
