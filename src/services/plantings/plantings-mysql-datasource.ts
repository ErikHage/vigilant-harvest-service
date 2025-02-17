import { Planting, PlantingRow } from './types';
import { QueryPayload } from '../../database/types';

import queries from './queries';
import db, { RowNotFoundError } from '../../database'
import rowMapper from './row-mapper';
import { ensureError, FeralError } from '../../errors';

async function upsertPlanting(planting: Planting): Promise<Planting> {
  let query: QueryPayload;
  try {
    query = {
      sql: queries.plantings.upsert,
      params: rowMapper.plantings.upsert.toParams(planting),
    };
  } catch (err) {
    throw new FeralError('Error building query and params to upsert planting', ensureError(err));
  }

  try {
    await db.execQuery(query);
    return planting;
  } catch (err) {
    throw new FeralError('Error upserting planting', ensureError(err))
      .withDebugParams({ query, });
  }
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

async function getPlantingsByYear(plantingYear: number): Promise<Planting[]> {
  const query: QueryPayload = {
    sql: queries.plantings.getByYear,
    params: [ plantingYear, ],
  };

  const results: PlantingRow[] = await db.execQuery<PlantingRow[]>(query);

  return results.map(rowMapper.plantings.fromRow);
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
  getPlantingsByYear,
  getPlantings,
  deletePlantingById,
}
