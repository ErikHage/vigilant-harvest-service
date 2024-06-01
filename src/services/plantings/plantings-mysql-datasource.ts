import { Planting, PlantingRow } from './types';
import { QueryPayload } from '../../database/types';

import queries from './queries';
import db, { RowNotFoundError } from '../../database'
import rowMapper from './row-mapper';

async function upsertPlanting(planting: Planting): Promise<Planting> {
  const queriesToExecute: QueryPayload[] = [
    {
      sql: queries.plantings.upsert,
      params: rowMapper.plantings.upsert.toParams(planting),
    },
  ];

  await db.execTransactionQuery(queriesToExecute);
  return planting;
}

async function getPlantingById(plantingId: string): Promise<Planting> {
  const query: QueryPayload = {
    sql: queries.plantings.getById,
    params: [ plantingId, ],
  };

  const results: PlantingRow[] = await db.execQuery<PlantingRow[]>(query);

  if (results.length < 1) {
    throw new RowNotFoundError('Planting not found', { plantingId, })
  }

  return rowMapper.plantings.fromRow(results[0]!);
}

async function getPlantings(): Promise<Planting[]> {
  const query: QueryPayload = {
    sql: queries.plantings.getAll,
    params: [],
  };

  const results: PlantingRow[] = await db.execQuery<PlantingRow[]>(query);

  return results.map(rowMapper.plantings.fromRow);
}

async function deletePlantingById(plantingId: string): Promise<void> {
  const query: QueryPayload = {
    sql: queries.plantings.deleteById,
    params: [ plantingId, ],
  };

  await db.execQuery(query);
}

export default {
  upsertPlanting,
  getPlantingById,
  getPlantings,
  deletePlantingById,
}
