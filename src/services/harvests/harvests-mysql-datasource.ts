import {
  DefaultHarvestTypeRow,
  Harvest,
  HarvestRow,
  HarvestSearchRequest,
  HarvestSummary,
  HarvestSummaryRequest,
  HarvestSummaryRow, HarvestUpsertInstruction, HydratedHarvest, HydratedHarvestRow,
  PlantingYearRow
} from './types';
import { QueryPayload } from '../../database/types';

import queries from './queries';
import db from '../../database'
import rowMapper from './row-mapper';

async function upsertHarvests(harvests: HarvestUpsertInstruction[]): Promise<Harvest[]> {
  const queriesToRun: QueryPayload[] = [];

  harvests.forEach(harvest => {
    queriesToRun.push({
      sql: queries.upsertHarvest,
      params: rowMapper.insert.toParams(harvest),
    });

    // the retyped harvest's quantity has moved to the row above, so its own row goes away with it
    if (harvest.absorbedHarvestId != null) {
      queriesToRun.push({
        sql: queries.deleteById,
        params: [ harvest.absorbedHarvestId, ],
      });
    }
  });

  await db.execTransactionQuery(queriesToRun);

  // re-read rather than echoing the input: the upsert preserves an existing row's harvest_type_id,
  // so the stored type is the authoritative one, and only the DB has the type name
  const writtenHarvests = await Promise.all(harvests.map(harvest => getHarvestById(harvest.harvestId)));

  return writtenHarvests.filter((harvest): harvest is Harvest => harvest !== null);
}

async function getHarvestById(harvestId: string): Promise<Harvest | null> {
  const query = {
    sql: queries.getHarvestById,
    params: [ harvestId, ],
  };

  const results = await db.execQuery<HarvestRow[]>(query);

  if (results.length === 0) {
    return null;
  }

  return rowMapper.fromRow(results[0]!);
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
  harvestDate: Date,
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
  getHarvestById,
  getPlantingYearByPlantingId,
  getDefaultHarvestTypeIdByPlantingId,
  getHarvestByPlantingIdDateAndType,
  getHarvestSummary,
  deleteHarvestById,
  searchHarvests,
  getHydratedHarvestsByYear,
}
