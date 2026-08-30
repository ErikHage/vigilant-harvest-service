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
import { BadRequestError } from '../../errors/common';
import harvestTypesService from '../harvest-types/harvest-types-service';

const logger = getLogger('harvests-service');

async function upsertHarvests(harvestRequests: HarvestRequest[]): Promise<Harvest[]> {
  // deliberately outside the try below, which would re-wrap the 400 as a 500
  await assertRequestedHarvestTypesExist(harvestRequests);

  try {
    // a request typically carries several harvests against the same planting, so resolve each
    // planting's default harvest type once rather than once per harvest
    const defaultHarvestTypeIds = await resolveDefaultHarvestTypeIds(harvestRequests);

    const harvestPromises: Promise<HarvestUpsertInstruction>[] = harvestRequests.map(async (harvestRequest) => {
      const maybeExistingHarvest = harvestRequest.harvestId != null
        ? await datasource.getHarvestById(harvestRequest.harvestId)
        : null;

      // a requested type wins; failing that an existing harvest keeps the type it is stored with,
      // and a new one inherits its plant's current default
      const harvestTypeId = harvestRequest.harvestTypeId
        ?? maybeExistingHarvest?.harvestTypeId
        ?? defaultHarvestTypeIds.get(harvestRequest.plantingId)
        ?? UNSPECIFIED_HARVEST_TYPE_ID;

      // a planting holds at most one harvest per day per type, so a harvest landing on a day that
      // already holds one of its type is absorbed by it: a new harvest accumulates into it, and an
      // existing harvest retyped onto the collision moves its quantity across and is deleted
      const maybeMergeTarget = await findMergeTarget(harvestRequest, harvestTypeId, maybeExistingHarvest);

      return {
        harvestId: maybeMergeTarget?.harvestId ?? harvestRequest.harvestId ?? v4(),
        plantingId: harvestRequest.plantingId,
        quantity: (maybeMergeTarget?.quantity ?? 0) + harvestRequest.quantity,
        harvestDate: harvestRequest.harvestDate,
        harvestTypeId,
        absorbedHarvestId: maybeMergeTarget != null ? maybeExistingHarvest?.harvestId : undefined,
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

async function assertRequestedHarvestTypesExist(requests: HarvestRequest[]): Promise<void> {
  const requestedIds = [ ...new Set(
    requests.map(request => request.harvestTypeId).filter((id): id is number => id != null)
  ), ];

  if (requestedIds.length === 0) {
    return;
  }

  const harvestTypes = await harvestTypesService.getHarvestTypes();
  const knownIds = new Set(harvestTypes.map(harvestType => harvestType.harvestTypeId));

  const unknownIds = requestedIds.filter(id => !knownIds.has(id));

  if (unknownIds.length > 0) {
    throw new BadRequestError(`Unknown harvest type id(s): ${unknownIds.join(', ')}`)
      .withDebugParams({ requests, });
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

async function findMergeTarget(
  request: HarvestRequest,
  harvestTypeId: number,
  maybeExistingHarvest: Harvest | null
): Promise<Harvest | null> {
  try {
    const maybeMergeTarget = await datasource.getHarvestByPlantingIdDateAndType(
      request.plantingId, request.harvestDate, harvestTypeId);

    // a harvest whose type is unchanged finds itself here, and is not a merge target for itself
    if (maybeMergeTarget?.harvestId === maybeExistingHarvest?.harvestId) {
      return null;
    }

    return maybeMergeTarget;
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
