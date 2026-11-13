import { v4 as uuidV4 } from 'uuid';

import {
  Planting, PlantingIdRow, PlantingPlantingYearRow,
  PlantingRow,
  PlantingStatusHistoryRecord,
  PlantingStatusHistoryRow,
  PlantingUpdate,
  SplitData
} from './types';
import { QueryPayload } from '../../database/types';

import queries from './queries';
import db, { RowNotFoundError } from '../../database'
import rowMapper from './row-mapper';
import { ensureError, FeralError } from '../../errors';
import constants from '../../util/constants';
import { PlantingsBreakdown, PlantingsBreakdownRow } from '../planting-years/types';
import { PlanningPlanting, PlanningPlantingRow } from '../planning/types';

async function insertPlanting(planting: Planting): Promise<Planting> {
  const transaction: QueryPayload[] = [
    {
      sql: queries.plantings.insert,
      params: rowMapper.plantings.insert.toParams(planting),
    },
    {
      sql: queries.yearMapping.insert,
      params: rowMapper.yearMapping.insert.toParams(planting),
    },
    _getInsertStatusHistoryQueryAndParams(planting.plantingId, constants.plantings.statuses.created, _buildInsertComment(planting)),
  ];

  try {
    await db.execTransactionQuery(transaction);
    return await getPlantingById(planting.plantingId);
  } catch (err) {
    throw new FeralError('Error inserting planting', ensureError(err))
      .withDebugParams({ transaction, });
  }
}

async function splitPlanting(sourcePlantingId: string, splits: SplitData[]): Promise<void> {
  const sourcePlanting = await getPlantingById(sourcePlantingId);
  const transaction: QueryPayload[] = _buildSplitQueries(sourcePlanting, splits);

  try {
    await db.execTransactionQuery(transaction);
  } catch (err) {
    throw new FeralError('Error cloning planting', ensureError(err))
      .withDebugParams({ transaction, });
  }
}

/**
 * PLANT, in one transaction: the remainder split off (when fewer are planted
 * than were sown), the planting moved to PLANTED, and its history row. If any
 * part fails, none of it is written.
 */
async function plantPlanting(
  planting: Planting,
  plantingUpdate: PlantingUpdate,
  remainder: SplitData | undefined,
  comment: string
): Promise<void> {
  const transaction: QueryPayload[] = [
    ...(remainder ? _buildSplitQueries(planting, [ remainder, ]) : []),
    _getUpdateQueryAndParams(planting.plantingId, plantingUpdate),
    _getInsertStatusHistoryQueryAndParams(planting.plantingId, plantingUpdate.status, comment),
  ];

  try {
    await db.execTransactionQuery(transaction);
  } catch (err) {
    throw new FeralError('Error planting out planting', ensureError(err))
      .withDebugParams({ transaction, });
  }
}

/**
 * START or RETIRE, in one transaction: the planting moved to its new status, and
 * the history row. If either fails, neither is written.
 */
async function changePlantingStatus(plantingId: string, plantingUpdate: PlantingUpdate, comment: string): Promise<void> {
  const transaction: QueryPayload[] = [
    _getUpdateQueryAndParams(plantingId, plantingUpdate),
    _getInsertStatusHistoryQueryAndParams(plantingId, plantingUpdate.status, comment),
  ];

  try {
    await db.execTransactionQuery(transaction);
  } catch (err) {
    throw new FeralError('Error changing planting status', ensureError(err))
      .withDebugParams({ transaction, });
  }
}

async function plotExists(plotId: string): Promise<boolean> {
  return await db.execCountQuery({ sql: queries.plantings.countPlotsById, params: [ plotId, ], }) > 0;
}

/** The queries that split `splits` off a planting, in order, for one transaction. */
function _buildSplitQueries(sourcePlanting: Planting, splits: SplitData[]): QueryPayload[] {
  const transaction: QueryPayload[] = [];
  const sourcePlantingId = sourcePlanting.plantingId;

  let sourceCount: number = sourcePlanting.numberSown!;
  for (const split of splits) {
    const newId = uuidV4();

    // copy the planting
    transaction.push({
      sql: queries.plantings.clone,
      params: [ newId, split.name, sourcePlantingId, ],
    });
    // copy the history
    transaction.push({
      sql: queries.plantingStatusHistory.clone,
      params: [ newId, sourcePlantingId, ],
    });
    // copy planting years
    transaction.push({
      sql: queries.yearMapping.clone,
      params: [ newId, sourcePlantingId, ],
    });

    // update existing record's count
    const updateQuery = queries.plantings.buildUpdateQuery([ 'current_status', 'number_sown', ]);
    transaction.push({
      sql: updateQuery,
      params: [ sourcePlanting.currentStatus, sourceCount - split.count, sourcePlantingId, ],
    });
    // update split record's count
    transaction.push({
      sql: updateQuery,
      params: [ sourcePlanting.currentStatus, split.count, newId, ],
    });

    transaction.push({
      sql: queries.plantingStatusHistory.insert,
      params: [
        sourcePlantingId,
        sourcePlanting.currentStatus,
        `Split out ${split.count} plants into planting ${split.name}`,
      ],
    });
    transaction.push({
      sql: queries.plantingStatusHistory.insert,
      params: [
        newId,
        sourcePlanting.currentStatus,
        `Split out ${split.count} plants from planting ${sourcePlanting.name}`,
      ],
    });

    sourceCount -= split.count;
  }

  return transaction;
}

function _buildInsertComment(planting: Planting): string {
  const filteredObject = Object.fromEntries(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Object.entries(planting).filter(([ _, value, ]) => value !== undefined)
  );
  return `${JSON.stringify(filteredObject)}`;
}

async function updatePlanting(plantingId: string, plantingUpdate: PlantingUpdate, updateComment?: string): Promise<void> {
  const transaction: QueryPayload[] = [ _getUpdateQueryAndParams(plantingId, plantingUpdate), ];

  if (updateComment) {
    transaction.push(_getInsertStatusHistoryQueryAndParams(plantingId, 'COMMENT', updateComment));
  }

  try {
    await db.execTransactionQuery(transaction);
  } catch (err) {
    throw new FeralError('Error updating planting', ensureError(err))
      .withDebugParams({ transaction, });
  }
}

function _getUpdateQueryAndParams(plantingId: string, plantingUpdate: PlantingUpdate): QueryPayload {
  const columns = rowMapper.plantings.update.toColumns(plantingUpdate);

  return {
    sql: queries.plantings.buildUpdateQuery(columns.map(([ column, ]) => column)),
    params: [ ...columns.map(([ , value, ]) => value), plantingId, ],
  };
}

function _getInsertStatusHistoryQueryAndParams(plantingId: string, status: string, comment: string): QueryPayload {
  return {
    sql: queries.plantingStatusHistory.insert,
    params: rowMapper.plantingStatusHistory.insert.toParams(plantingId, status, comment),
  };
}

async function insertStatusHistory(plantingId: string, status: string, comment: string): Promise<void> {
  const query: QueryPayload = _getInsertStatusHistoryQueryAndParams(plantingId, status, comment);

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
  const yearsQuery = {
    sql: queries.yearMapping.getById,
    params: [ plantingId, ],
  }

  const results: PlantingRow[] = await db.execQuery<PlantingRow[]>(query);
  const historyResults: PlantingStatusHistoryRow[] = await db.execQuery(historyQuery);
  const years: PlantingPlantingYearRow[] = await db.execQuery(yearsQuery);

  if (results.length < 1) {
    throw new RowNotFoundError('Planting not found', { plantingId, })
  }

  return rowMapper.plantings.fromRow(results[0]!, historyResults, years);
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

  return await _withHistoryAndYears(results);
}

async function getPlantingIdsToCarryForward(plantingYear: number): Promise<string[]> {
  const query: QueryPayload = {
    sql: queries.plantings.getCarryForward,
    params: [ plantingYear, ],
  };

  const results: PlantingIdRow[] = await db.execQuery<PlantingIdRow[]>(query);

  const ids = results.map(plantingRow => plantingRow.planting_id);

  return ids;
}

async function getPlantings(): Promise<Planting[]> {
  const query: QueryPayload = {
    sql: queries.plantings.getAll,
    params: [],
  };

  const results: PlantingRow[] = await db.execQuery<PlantingRow[]>(query);

  return await _withHistoryAndYears(results);
}

/**
 * The listed plantings, each with its history and its years, as a single read gives them: two
 * queries for the whole list, rather than two for each planting.
 */
async function _withHistoryAndYears(rows: PlantingRow[]): Promise<Planting[]> {
  if (rows.length === 0) {
    return [];
  }

  const plantingIds = rows.map(row => row.planting_id);
  const historyRows = await db.execQuery<PlantingStatusHistoryRow[]>({
    sql: queries.plantingStatusHistory.getByPlantingIds(plantingIds.length),
    params: plantingIds,
  });
  const yearRows = await db.execQuery<PlantingPlantingYearRow[]>({
    sql: queries.yearMapping.getByPlantingIds(plantingIds.length),
    params: plantingIds,
  });
  const historyById = _byPlantingId(historyRows);
  const yearsById = _byPlantingId(yearRows);

  return rows.map(row => rowMapper.plantings.fromRow(
    row,
    historyById.get(row.planting_id) ?? [],
    yearsById.get(row.planting_id) ?? []));
}

function _byPlantingId<T extends { planting_id: string }>(rows: T[]): Map<string, T[]> {
  const byId = new Map<string, T[]>();

  rows.forEach(row => byId.set(row.planting_id, [ ...(byId.get(row.planting_id) ?? []), row, ]));

  return byId;
}

async function getPlanningPlantings(year: number, status: string): Promise<PlanningPlanting[]> {
  const query: QueryPayload = {
    sql: queries.plantings.getPlanningPlantings,
    params: [ year, status, ],
  };

  const results: PlanningPlantingRow[] = await db.execQuery<PlanningPlantingRow[]>(query);

  return results.map(row => rowMapper.plantings.planning.fromRow(row));
}

async function getPlantingsBreakdown(): Promise<Map<number, PlantingsBreakdown>> {
  const query: QueryPayload = {
    sql: queries.plantings.getStatusBreakdowns,
    params: [],
  };

  const results: PlantingsBreakdownRow[] = await db.execQuery<PlantingsBreakdownRow[]>(query);

  return rowMapper.plantings.breakdown.fromRows(results);
}

async function countHarvestsByPlantingId(plantingId: string): Promise<number> {
  const query: QueryPayload = {
    sql: queries.plantings.countHarvestsByPlantingId,
    params: [ plantingId, ],
  };

  return await db.execCountQuery(query);
}

// status history and year mappings go with the planting, by ON DELETE CASCADE
async function deletePlantingById(plantingId: string): Promise<void> {
  const query: QueryPayload = {
    sql: queries.plantings.deleteById,
    params: [ plantingId, ],
  };

  await db.execQuery(query);
}

export default {
  insertPlanting,
  splitPlanting,
  plantPlanting,
  changePlantingStatus,
  plotExists,
  updatePlanting,
  getPlantingById,
  getPlantingsBreakdown,
  getPlantingsByYear,
  getPlantingIdsToCarryForward,
  getPlantings,
  getPlanningPlantings,
  countHarvestsByPlantingId,
  deletePlantingById,

  insertStatusHistory,
  getPlantingStatusHistoryByPlantingId,
}
