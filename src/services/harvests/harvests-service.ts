import { v4 } from 'uuid';

import {
  Harvest,
  HarvestRequest,
  HarvestSearchRequest,
  HarvestStats, HarvestStatsRequest,
  HarvestSummary,
  HarvestSummaryRequest, HarvestUpsertInstruction, HydratedHarvest
} from './types';

import datasource from './harvests-mysql-datasource';
import { ensureError, FeralError } from '../../errors';
import { getLogger } from '../../logging';
import stats from './stats';
import { UNSPECIFIED_HARVEST_TYPE_ID } from '../harvest-types/types';

const logger = getLogger('harvests-service');

async function upsertHarvests(harvestRequests: HarvestRequest[]): Promise<Harvest[]> {
  try {
    // a request typically carries several harvests against the same planting, so resolve each
    // planting's default harvest type once rather than once per harvest
    const defaultHarvestTypeIds = await resolveDefaultHarvestTypeIds(harvestRequests);

    const harvestPromises: Promise<HarvestUpsertInstruction>[] = harvestRequests.map(async (harvestRequest) => {
      const defaultHarvestTypeId = defaultHarvestTypeIds.get(harvestRequest.plantingId)
        ?? UNSPECIFIED_HARVEST_TYPE_ID;

      // an explicit id is an update: the quantity is replaced and the stored type is kept
      if (harvestRequest.harvestId != null) {
        const maybeExistingHarvest = await datasource.getHarvestById(harvestRequest.harvestId);

        return {
          harvestId: harvestRequest.harvestId,
          plantingId: harvestRequest.plantingId,
          quantity: harvestRequest.quantity,
          harvestDate: harvestRequest.harvestDate,
          harvestTypeId: maybeExistingHarvest?.harvestTypeId ?? defaultHarvestTypeId,
        };
      }

      // no id: accumulate into the same planting's same-day harvest, but only one recorded under
      // the plant's current default type. When the default has changed this finds nothing and a
      // second harvest is recorded for the day, so the two types stay separate rather than being
      // summed together.
      const maybeMergeTarget = await maybeMergeHarvest(harvestRequest, defaultHarvestTypeId);

      return {
        harvestId: maybeMergeTarget?.harvestId ?? v4(),
        plantingId: harvestRequest.plantingId,
        quantity: (maybeMergeTarget?.quantity ?? 0) + harvestRequest.quantity,
        harvestDate: harvestRequest.harvestDate,
        harvestTypeId: defaultHarvestTypeId, // equals the merge target's type when there is one
      };
    });

    const harvests: HarvestUpsertInstruction[] = await Promise.all(harvestPromises);

    return await datasource.upsertHarvests(harvests);
  } catch (err) {
    const error = new FeralError('Error upserting harvests', ensureError(err))
      .withDebugParams({ harvestRequests, });
    logger.error(error, 'Error upserting harvests');
    throw error;
  }
}

async function resolveDefaultHarvestTypeIds(requests: HarvestRequest[]): Promise<Map<string, number>> {
  const plantingIds = [ ...new Set(requests.map(request => request.plantingId)), ];

  const entries = await Promise.all(plantingIds.map(async (plantingId): Promise<[string, number]> => {
    const defaultHarvestTypeId = await datasource.getDefaultHarvestTypeIdByPlantingId(plantingId);
    return [ plantingId, defaultHarvestTypeId ?? UNSPECIFIED_HARVEST_TYPE_ID, ];
  }));

  return new Map(entries);
}

async function maybeMergeHarvest(request: HarvestRequest, harvestTypeId: number): Promise<Harvest | null> {
  try {
    return await datasource.getHarvestByPlantingIdDateAndType(
      request.plantingId, request.harvestDate, harvestTypeId);
  } catch (err) {
    const error = new FeralError('Error merging harvest', ensureError(err))
      .withDebugParams({ request, harvestTypeId, });
    logger.error(error, 'Error merging harvest', { request, harvestTypeId, });
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
    return stats.calculate(harvests, request.type);
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
