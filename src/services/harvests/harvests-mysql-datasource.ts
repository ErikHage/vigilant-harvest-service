import {
  Harvest,
  HarvestRow,
  HarvestSearchRequest,
  HarvestSummary,
  HarvestSummaryRequest,
  HarvestSummaryRow
} from './types';
import { QueryPayload } from '../../database/types';

import queries from './queries';
import db from '../../database'
import rowMapper from './row-mapper';

async function upsertHarvests(harvests: Harvest[]): Promise<Harvest[]> {
  const queriesToRun: QueryPayload[] = [];

  harvests.forEach(harvest => {
    queriesToRun.push({
      sql: queries.upsertHarvest,
      params: rowMapper.insert.toParams(harvest),
    });
  });

  await db.execTransactionQuery(queriesToRun);

  return harvests;
}

async function getHarvestByPlantingIdAndDate(plantingId: string, harvestDate: Date): Promise<Harvest | null> {
  const query = {
    sql: queries.getHarvestByPlantingIdAndDate,
    params: rowMapper.getByPlantingIdAndDate.toParams(plantingId, harvestDate),
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

async function deleteHarvestById(harvestId: string): Promise<void> {
  const query = {
    sql: queries.deleteById,
    params: [ harvestId, ],
  };

  await db.execQuery(query);
}

export default {
  upsertHarvests,
  getHarvestByPlantingIdAndDate,
  getHarvestSummary,
  deleteHarvestById,
  searchHarvests,
}
