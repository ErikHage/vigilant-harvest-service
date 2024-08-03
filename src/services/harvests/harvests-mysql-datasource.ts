import { Harvest, HarvestRow, HarvestSummary, HarvestSummaryRequest, HarvestSummaryRow } from './types';
import { QueryPayload } from '../../database/types';

import queries from './queries';
import db, { RowNotFoundError } from '../../database'
import rowMapper from './row-mapper';

async function upsertHarvest(harvest: Harvest): Promise<Harvest> {
  const query: QueryPayload = {
    sql: queries.upsertHarvest,
    params: rowMapper.upsert.toParams(harvest),
  };

  await db.execQuery(query);
  return harvest;
}

async function getHarvestById(harvestId: string): Promise<Harvest> {
  const query = {
    sql: queries.getById,
    params: [ harvestId, ],
  };

  const results = await db.execQuery<HarvestRow[]>(query);

  if (results.length < 1) {
    throw new RowNotFoundError('Harvest not found', { harvestId, });
  }

  return rowMapper.fromRow(results[0]!);
}

async function getHarvests(): Promise<Harvest[]> {
  const query = {
    sql: queries.getAll,
    params: [],
  };

  const results = await db.execQuery<HarvestRow[]>(query);

  return results.map(rowMapper.fromRow);
}

async function getHarvestSummary(request: HarvestSummaryRequest): Promise<HarvestSummary[]> {
  const query = {
    sql: queries.getHarvestSummary,
    params: rowMapper.summary.toParams(request),
  };

  const results = await db.execQuery<HarvestSummaryRow[]>(query);

  return results.map(rowMapper.summary.fromRow);
}

async function deleteHarvestById(harvestId: string): Promise<void> {
  const query = {
    sql: queries.deleteById,
    params: [ harvestId, ],
  };

  await db.execQuery(query);
}

export default {
  upsertHarvest,
  getHarvestById,
  getHarvests,
  getHarvestSummary,
  deleteHarvestById,
}
