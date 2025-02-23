import { Planting, PlantingRow, PlantingUpdate } from './types';
import { QueryPayload } from '../../database/types';

import queries from './queries';
import db, { RowNotFoundError } from '../../database'
import rowMapper from './row-mapper';
import { ensureError, FeralError } from '../../errors';
import constants from '../../util/constants';

async function insertPlanting(planting: Planting): Promise<Planting> {
  const query: QueryPayload = {
    sql: queries.plantings.insert,
    params: rowMapper.plantings.insert.toParams(planting),
  };

  try {
    await db.execQuery(query);
    await insertStatusHistory(planting.plantingId, constants.plantings.statuses.created, '');
    return await getPlantingById(planting.plantingId);
  } catch (err) {
    throw new FeralError('Error inserting planting', ensureError(err))
      .withDebugParams({ query, });
  }
}

async function updatePlanting(plantingId: string, plantingUpdate: PlantingUpdate) {
  const query: QueryPayload = {
    sql: queries.plantings.buildUpdateQuery(plantingUpdate),
    params: rowMapper.plantings.update.toParams(plantingId, plantingUpdate),
  };

  try {
    await db.execQuery(query);
    await insertStatusHistory(plantingId, plantingUpdate.status, plantingUpdate.comment)
  } catch (err) {
    throw new FeralError('Error updating planting', ensureError(err))
      .withDebugParams({ query, });
  }
}

async function insertStatusHistory(plantingId: string, status: string, comment: string): Promise<void> {
  const query: QueryPayload = {
    sql: queries.plantings.insertStatusHistory,
    params: rowMapper.plantings.statusHistory.insert.toParams(plantingId, status, comment),
  };

  try {
    await db.execQuery(query);
  } catch (err) {
    throw new FeralError('Error adding planting status history record', ensureError(err))
      .withDebugParams({ query, });
  }
}

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
  insertPlanting,
  updatePlanting,
  insertStatusHistory,
  upsertPlanting,
  getPlantingById,
  getPlantingsByYear,
  getPlantings,
  deletePlantingById,
}
