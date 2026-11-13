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
import stats from './stats';
import { UNSPECIFIED_HARVEST_TYPE_ID } from '../harvest-types/types';
import { BadRequestError } from '../../errors/common';
import harvestTypesService from '../harvest-types/harvest-types-service';

async function upsertHarvests(harvestRequests: HarvestRequest[]): Promise<Harvest[]> {
  // deliberately outside the try below, which would re-wrap the 400 as a 500
  await assertRequestedHarvestTypesExist(harvestRequests);
  const plantingYears = await resolvePlantingYears(harvestRequests);

  try {
    // a request typically carries several harvests against the same planting, so resolve each
    // planting's default harvest type once rather than once per harvest
    const defaultHarvestTypeIds = await resolveDefaultHarvestTypeIds(harvestRequests);

    const harvestPromises: Promise<HarvestUpsertInstruction>[] = harvestRequests.map(async (harvestRequest): Promise<HarvestUpsertInstruction> => {
      const maybeExistingHarvest = harvestRequest.harvestId != null
        ? await datasource.getStoredHarvestById(harvestRequest.harvestId)
        : null;

      // a requested type wins; failing that an existing harvest keeps the type it is stored with,
      // and a new one inherits its plant's current default
      const harvestTypeId = harvestRequest.harvestTypeId
        ?? maybeExistingHarvest?.harvestTypeId
        ?? defaultHarvestTypeIds.get(harvestRequest.plantingId)
        ?? UNSPECIFIED_HARVEST_TYPE_ID;

      // A planting holds at most one harvest per day per type, and the database's key folds a
      // harvest into the one already there. An existing harvest is written again in place of its
      // row, keeping its id, the year it was filed under and when it was made. If its new day and
      // type hold another harvest, it is added to that one instead, and its id goes.
      return {
        harvestId: harvestRequest.harvestId ?? v4(),
        plantingId: harvestRequest.plantingId,
        plantingYear: maybeExistingHarvest?.plantingYear ?? plantingYears.get(harvestRequest.plantingId)!,
        quantity: harvestRequest.quantity,
        harvestDate: harvestRequest.harvestDate,
        harvestTypeId,
        replacesStoredHarvest: maybeExistingHarvest != null,
        dateCreated: maybeExistingHarvest?.dateCreated,
      };
    });

    const harvests: HarvestUpsertInstruction[] = await Promise.all(harvestPromises);

    return await datasource.upsertHarvests(harvests);
  } catch (err) {
    throw new FeralError('Error upserting harvests', ensureError(err))
      .withDebugParams({ harvestRequests, });
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

// a new harvest is filed under its planting's current year; a planting that does not exist is the
// client's mistake, so it is reported by id rather than left to fail the insert
async function resolvePlantingYears(requests: HarvestRequest[]): Promise<Map<string, number>> {
  const plantingIds = [ ...new Set(requests.map(request => request.plantingId)), ];

  const entries = await Promise.all(plantingIds.map(async (plantingId): Promise<[string, number | null]> =>
    [ plantingId, await datasource.getPlantingYearByPlantingId(plantingId), ]));

  const unknownIds = entries.filter(([ , plantingYear, ]) => plantingYear === null).map(([ plantingId, ]) => plantingId);

  if (unknownIds.length > 0) {
    throw new BadRequestError(`Unknown planting id(s): ${unknownIds.join(', ')}`)
      .withDebugParams({ requests, });
  }

  return new Map(entries as [string, number][]);
}

async function resolveDefaultHarvestTypeIds(requests: HarvestRequest[]): Promise<Map<string, number>> {
  const plantingIds = [ ...new Set(requests.map(request => request.plantingId)), ];

  const entries = await Promise.all(plantingIds.map(async (plantingId): Promise<[string, number]> => {
    const defaultHarvestTypeId = await datasource.getDefaultHarvestTypeIdByPlantingId(plantingId);
    return [ plantingId, defaultHarvestTypeId ?? UNSPECIFIED_HARVEST_TYPE_ID, ];
  }));

  return new Map(entries);
}

async function getHarvestSummary(request: HarvestSummaryRequest): Promise<HarvestSummary[]> {
  try {
    return await datasource.getHarvestSummary(request);
  } catch (err) {
    throw new FeralError('Error getting harvest summary', ensureError(err))
      .withDebugParams({ request, });
  }
}

async function searchHarvests(request: HarvestSearchRequest): Promise<Harvest[]> {
  try {
    return await datasource.searchHarvests(request);
  } catch (err) {
    throw new FeralError('Error searching harvests', ensureError(err))
      .withDebugParams({ request, });
  }
}

async function getHarvestStats(request: HarvestStatsRequest): Promise<HarvestStats> {
  try {
    const harvests: HydratedHarvest[] = await datasource.getHydratedHarvestsByYear(request.year);
    return stats.calculate(harvests, request.type);
  } catch (err) {
    throw new FeralError('Error getting harvest stats', ensureError(err))
      .withDebugParams({ request, });
  }
}

async function deleteHarvestById(harvestId: string): Promise<void> {
  try {
    await datasource.deleteHarvestById(harvestId);
  } catch (err) {
    throw new FeralError('Error deleting harvests by id', ensureError(err))
      .withDebugParams({ harvestId, });
  }
}

export default {
  upsertHarvests,
  getHarvestSummary,
  deleteHarvestById,
  searchHarvests,
  getHarvestStats,
}
