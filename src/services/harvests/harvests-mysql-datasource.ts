import { Harvest, HarvestSummary, HarvestSummaryRequest, HarvestSummaryRow } from './types';
import { QueryPayload } from '../../database/types';

import queries from './queries';
import db from '../../database'
import rowMapper from './row-mapper';

async function insertHarvests(harvests: Harvest[]): Promise<Harvest[]> {
  const queriesToRun: QueryPayload[] = [];

  harvests.forEach(harvest => {
    queriesToRun.push({
      sql: queries.insertHarvest,
      params: rowMapper.insert.toParams(harvest),
    });
  });

  await db.execTransactionQuery(queriesToRun);

  return harvests;
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
  insertHarvests,
  getHarvestSummary,
  deleteHarvestById,
}
