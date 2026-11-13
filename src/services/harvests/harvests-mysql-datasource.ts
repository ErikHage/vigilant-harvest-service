import {
  DefaultHarvestTypeRow,
  Harvest,
  HarvestRow,
  HarvestSearchRequest,
  HarvestSummary,
  HarvestSummaryRequest,
  HarvestSummaryRow, HarvestUpsertInstruction, HydratedHarvest, HydratedHarvestRow,
  PlantingYearRow,
  StoredHarvest,
  StoredHarvestRow
} from './types';
import { QueryPayload } from '../../database/types';

import queries from './queries';
import db from '../../database'
import rowMapper from './row-mapper';

async function upsertHarvests(harvests: HarvestUpsertInstruction[]): Promise<Harvest[]> {
  // Every existing harvest's row goes first, then each harvest is written again or added. So two
  // harvests swapping days or types never meet their own old rows, and whatever lands on one day
  // and type is added up there.
  const queriesToRun: QueryPayload[] = [
    ...harvests
      .filter(harvest => harvest.replacesStoredHarvest)
      .map(harvest => ({ sql: queries.deleteById, params: [ harvest.harvestId, ], })),
    ...harvests.map(harvest => ({ sql: queries.insertOrAddHarvest, params: rowMapper.insert.toParams(harvest), })),
  ];

  await db.execTransactionQuery(queriesToRun);

  // Re-read by planting, day and type rather than by id: a harvest added to another is that one
  // now. Several sent harvests can be one row, which is answered once.
  const written = await Promise.all(harvests.map(harvest =>
    getHarvestByPlantingIdDateAndType(harvest.plantingId, harvest.harvestDate, harvest.harvestTypeId)));
  const byId = new Map<string, Harvest>();
  written.forEach(harvest => {
    if (harvest !== null && !byId.has(harvest.harvestId)) {
      byId.set(harvest.harvestId, harvest);
    }
  });

  return [ ...byId.values(), ];
}

async function getStoredHarvestById(harvestId: string): Promise<StoredHarvest | null> {
  const query = {
    sql: queries.getStoredHarvestById,
    params: [ harvestId, ],
  };

  const results = await db.execQuery<StoredHarvestRow[]>(query);

  if (results.length === 0) {
    return null;
  }

  return rowMapper.fromStoredRow(results[0]!);
}

async function getPlantingYearByPlantingId(plantingId: string): Promise<number | null> {
  const query = {
    sql: queries.getPlantingYearByPlantingId,
    params: [ plantingId, ],
  };

  const results = await db.execQuery<PlantingYearRow[]>(query);

  if (results.length === 0) {
    return null;
  }

  return results[0]!.current_planting_year;
}

async function getDefaultHarvestTypeIdByPlantingId(plantingId: string): Promise<number | null> {
  const query = {
    sql: queries.getDefaultHarvestTypeIdByPlantingId,
    params: [ plantingId, ],
  };

  const results = await db.execQuery<DefaultHarvestTypeRow[]>(query);

  if (results.length === 0) {
    return null;
  }

  return results[0]!.default_harvest_type_id;
}

async function getHarvestByPlantingIdDateAndType(
  plantingId: string,
  harvestDate: string,
  harvestTypeId: number
): Promise<Harvest | null> {
  const query = {
    sql: queries.getHarvestByPlantingIdDateAndType,
    params: rowMapper.getByPlantingIdDateAndType.toParams(plantingId, harvestDate, harvestTypeId),
  };

  const results = await db.execQuery<HarvestRow[]>(query);

  if (results.length === 0) {
    return null;
  }

  return rowMapper.fromRow(results[0]!);
}

async function getHarvestSummary(request: HarvestSummaryRequest): Promise<HarvestSummary[]> {
  const query = {
    sql: queries.getHarvestSummary,
    params: rowMapper.summary.toParams(request),
  };

  const results = await db.execQuery<HarvestSummaryRow[]>(query);

  return results.map(rowMapper.summary.fromRow);
}

async function searchHarvests(request: HarvestSearchRequest): Promise<Harvest[]> {
  const query = {
    sql: queries.searchHarvests,
    params: rowMapper.search.toParams(request),
  };

  const results = await db.execQuery<HarvestRow[]>(query);

  return results.map(rowMapper.fromRow);
}

async function getHydratedHarvestsByYear(year: number): Promise<HydratedHarvest[]> {
  const query = {
    sql: queries.getHydratedHarvestsByYear,
    params: [ year, ],
  };

  const results = await db.execQuery<HydratedHarvestRow[]>(query);

  return results.map(rowMapper.fromHydratedRow);
}

async function deleteHarvestById(harvestId: string): Promise<void> {
  const query = {
    sql: queries.deleteById,
    params: [ harvestId, ],
  };

  await db.execQuery(query);
}

export default {
  upsertHarvests,
  getStoredHarvestById,
  getPlantingYearByPlantingId,
  getDefaultHarvestTypeIdByPlantingId,
  getHarvestSummary,
  deleteHarvestById,
  searchHarvests,
  getHydratedHarvestsByYear,
}
