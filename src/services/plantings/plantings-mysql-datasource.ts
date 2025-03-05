import {
  Planting,
  PlantingRow,
  PlantingStatusHistoryRecord,
  PlantingStatusHistoryRow,
  PlantingUpdate
} from './types';
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
    await insertStatusHistory(
      planting.plantingId,
      constants.plantings.statuses.created,
      buildInsertComment(planting));
    return await getPlantingById(planting.plantingId);
  } catch (err) {
    throw new FeralError('Error inserting planting', ensureError(err))
      .withDebugParams({ query, });
  }
}

function buildInsertComment(planting: Planting): string {
  const filteredObject = Object.fromEntries(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Object.entries(planting).filter(([ _, value, ]) => value !== undefined)
  );
  return `${JSON.stringify(filteredObject)}`;
}

async function updatePlanting(plantingId: string, plantingUpdate: PlantingUpdate) {
  const query: QueryPayload = {
    sql: queries.plantings.buildUpdateQuery(plantingUpdate),
    params: rowMapper.plantings.update.toParams(plantingId, plantingUpdate),
  };

  try {
    await db.execQuery(query);
  } catch (err) {
    throw new FeralError('Error updating planting', ensureError(err))
      .withDebugParams({ query, });
  }
}

async function insertStatusHistory(plantingId: string, status: string, comment: string): Promise<void> {
  const query: QueryPayload = {
    sql: queries.plantingStatusHistory.insert,
    params: rowMapper.plantingStatusHistory.insert.toParams(plantingId, status, comment),
  };

  try {
    await db.execQuery(query);
  } catch (err) {
    throw new FeralError('Error adding planting status history record', ensureError(err))
      .withDebugParams({ query, });
  }
}

async function getPlantingById(plantingId: string): Promise<Planting> {
  const query: QueryPayload = {
    sql: queries.plantings.getById,
    params: [ plantingId, ],
  };
  const historyQuery: QueryPayload = {
    sql: queries.plantingStatusHistory.getByPlantingId,
    params: [ plantingId, ],
  };

  const results: PlantingRow[] = await db.execQuery<PlantingRow[]>(query);
  const historyResults: PlantingStatusHistoryRow[] = await db.execQuery(historyQuery);

  if (results.length < 1) {
    throw new RowNotFoundError('Planting not found', { plantingId, })
  }

  return rowMapper.plantings.fromRow(results[0]!, historyResults);
}

async function getPlantingStatusHistoryByPlantingId(plantingId: string): Promise<PlantingStatusHistoryRecord[]> {
  const query: QueryPayload = {
    sql: queries.plantingStatusHistory.getByPlantingId,
    params: [ plantingId, ],
  };

  const results: PlantingStatusHistoryRow[] = await db.execQuery<PlantingStatusHistoryRow[]>(query);

  return results.map(rowMapper.plantingStatusHistory.fromRow);
}

async function getPlantingsByYear(plantingYear: number): Promise<Planting[]> {
  const query: QueryPayload = {
    sql: queries.plantings.getByYear,
    params: [ plantingYear, ],
  };

  const results: PlantingRow[] = await db.execQuery<PlantingRow[]>(query);

  return results.map(plantingRow => rowMapper.plantings.fromRow(plantingRow, []));
}

async function getPlantings(): Promise<Planting[]> {
  const query: QueryPayload = {
    sql: queries.plantings.getAll,
    params: [],
  };

  const results: PlantingRow[] = await db.execQuery<PlantingRow[]>(query);

  return results.map(plantingRow => rowMapper.plantings.fromRow(plantingRow, []));
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
  getPlantingById,
  getPlantingsByYear,
  getPlantings,
  deletePlantingById,

  insertStatusHistory,
  getPlantingStatusHistoryByPlantingId,
}
