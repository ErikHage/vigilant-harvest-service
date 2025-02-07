import { v4 } from 'uuid';

import {
  Harvest,
  HarvestRequest,
  HarvestSearchRequest,
  HarvestStats, HarvestStatsRequest,
  HarvestSummary,
  HarvestSummaryRequest, HydratedHarvest
} from './types';

import datasource from './harvests-mysql-datasource';
import { ensureError, FeralError } from '../../errors';
import { getLogger } from '../../logging';
import harvestStats from './harvest-stats';

const logger = getLogger('harvests-service');

async function upsertHarvests(harvestRequests: HarvestRequest[]): Promise<Harvest[]> {
  try {
    const harvestPromises: Promise<Harvest>[] = harvestRequests.map(async (harvestRequest) => {
      let maybeExistingHarvest = null;

      if (harvestRequest.harvestId == null) {
        maybeExistingHarvest = await maybeMergeHarvest(harvestRequest);
      }

      const quantity = maybeExistingHarvest !== null
        ? maybeExistingHarvest.quantity + harvestRequest.quantity
        : harvestRequest.quantity;

      return {
        harvestId: maybeExistingHarvest?.harvestId || harvestRequest.harvestId || v4(),
        plantingId: harvestRequest.plantingId,
        quantity,
        harvestDate: harvestRequest.harvestDate,
      };
    });

    const harvests: Harvest[] = await Promise.all(harvestPromises);

    return await datasource.upsertHarvests(harvests);
  } catch (err) {
    const error = new FeralError('Error upserting harvests', ensureError(err))
      .withDebugParams({ harvestRequests, });
    logger.error(error, 'Error upserting harvests');
    throw error;
  }
}

async function maybeMergeHarvest(request: HarvestRequest): Promise<Harvest | null> {
  try {
    return await datasource.getHarvestByPlantingIdAndDate(request.plantingId, request.harvestDate);
  } catch (err) {
    const error = new FeralError('Error merging harvest', ensureError(err))
      .withDebugParams({ request, });
    logger.error(error, 'Error merging harvest', { request, });
    throw error;
  }
}

async function getHarvestSummary(request: HarvestSummaryRequest): Promise<HarvestSummary[]> {
  try {
    return await datasource.getHarvestSummary(request);
  } catch (err) {
    const error = new FeralError('Error getting harvest summary', ensureError(err))
      .withDebugParams({ request, });
    logger.error(error, 'Error getting harvest summary', { request, });
    throw error;
  }
}

async function searchHarvests(request: HarvestSearchRequest): Promise<Harvest[]> {
  try {
    return await datasource.searchHarvests(request);
  } catch (err) {
    const error = new FeralError('Error searching harvests', ensureError(err))
      .withDebugParams({ request, });
    logger.error(error, 'Error searching harvests', { request, });
    throw err;
  }
}

async function getHarvestStats(request: HarvestStatsRequest): Promise<HarvestStats> {
  try {
    const harvests: HydratedHarvest[] = await datasource.getHydratedHarvestsByYear(request.year);
    return harvestStats.calculate(harvests);
  } catch (err) {
    const error = new FeralError('Error getting harvest stats', ensureError(err))
      .withDebugParams({ request, });
    logger.error(error, 'Error getting harvest stats', { request, });
    throw error;
  }
}

async function deleteHarvestById(harvestId: string): Promise<void> {
  try {
    await datasource.deleteHarvestById(harvestId);
  } catch (err) {
    const error = new FeralError('Error deleting harvests by id', ensureError(err))
      .withDebugParams({ harvestId, });
    logger.error(error, 'Error deleting harvest by id %s', harvestId);
    throw error;
  }
}

export default {
  upsertHarvests,
  getHarvestSummary,
  deleteHarvestById,
  searchHarvests,
  getHarvestStats,
}
