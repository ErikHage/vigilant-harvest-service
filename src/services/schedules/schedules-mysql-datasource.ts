import { ResultSetHeader } from 'mysql2';
import { QueryPayload } from '../../database/types';
import queries from '../schedules/queries';
import rowMapper from '../schedules/row-mapper';
import db, { RowNotFoundError } from '../../database';
import {
  ActivitySchedule,
  ActivityScheduleCreateRequest,
  ActivityScheduleItem,
  ActivityScheduleItemCreateRequest,
  ActivityScheduleItemDeleteRequest,
  ActivityScheduleItemRow,
  ActivityScheduleItemUpdateRequest,
  ActivityScheduleRow,
  ActivityScheduleUpdateRequest
} from './types';

async function insertSchedule(activityScheduleId: string, schedule: ActivityScheduleCreateRequest): Promise<ActivitySchedule> {
  const query: QueryPayload = {
    sql: queries.schedules.insert,
    params: rowMapper.schedules.insert.toParams(activityScheduleId, schedule),
  };

  await db.execQuery(query);

  return {
    activityScheduleId,
    name: schedule.name,
    // as a read of it would report
    description: schedule.description ?? null,
    items: [],
  };
}

async function listSchedules(): Promise<ActivitySchedule[]> {
  const query: QueryPayload = {
    sql: queries.schedules.list,
    params: [],
  };

  const results: ActivityScheduleRow[] = await db.execQuery<ActivityScheduleRow[]>(query);

  return results.map(rowMapper.schedules.list.fromRow);
}

async function getScheduleById(activityScheduleId: string): Promise<ActivitySchedule> {
  const query: QueryPayload = {
    sql: queries.schedules.getById,
    params: [ activityScheduleId, ],
  };
  const itemsQuery: QueryPayload = {
    sql: queries.scheduleItems.getByActivityScheduleId,
    params: [ activityScheduleId, ],
  };

  const scheduleResults: ActivityScheduleRow[] = await db.execQuery<ActivityScheduleRow[]>(query);

  if (scheduleResults.length !== 1) {
    throw new RowNotFoundError('Activity schedule not found', { activityScheduleId, });
  }

  const itemResults: ActivityScheduleItemRow[] = await db.execQuery<ActivityScheduleItemRow[]>(itemsQuery);

  return rowMapper.schedules.getById.fromRows(scheduleResults[0]!, itemResults);
}

/** Writes only what the PATCH sent. A schedule that doesn't exist is a 404, from the re-read. */
async function updateSchedule(scheduleUpdateRequest: ActivityScheduleUpdateRequest): Promise<ActivitySchedule> {
  const columns = rowMapper.schedules.update.toColumns(scheduleUpdateRequest);

  if (columns.length > 0) {
    await db.execQuery({
      sql: queries.schedules.buildUpdate(columns.map(([ column, ]) => column)),
      params: [ ...columns.map(([ , value, ]) => value), scheduleUpdateRequest.activityScheduleId, ],
    });
  }

  return await getScheduleById(scheduleUpdateRequest.activityScheduleId);
}

// items and plant links go with the schedule, by ON DELETE CASCADE
async function deleteSchedule(activityScheduleId: string): Promise<void> {
  const query: QueryPayload = {
    sql: queries.schedules.delete,
    params: [ activityScheduleId, ],
  };

  await db.execQuery(query);
}

async function getScheduleItemById(entryId: string): Promise<ActivityScheduleItem> {
  const query = {
    sql: queries.scheduleItems.getByEntryId,
    params: [ entryId, ],
  };

  const results: ActivityScheduleItemRow[] = await db.execQuery<ActivityScheduleItemRow[]>(query);

  if (results.length !== 1) {
    throw new RowNotFoundError('Activity schedule item not found', { entryId, });
  }

  return rowMapper.scheduleItems.fromRow(results[0]!);
}

async function insertScheduleItem(entryId: string, scheduleItem: ActivityScheduleItemCreateRequest): Promise<ActivityScheduleItem> {
  const query: QueryPayload = {
    sql: queries.scheduleItems.insert,
    params: rowMapper.scheduleItems.insert.toParams(entryId, scheduleItem),
  }

  await db.execQuery(query);

  return await getScheduleItemById(entryId);
}

/**
 * Writes only what the PATCH sent, and only to an item on the path's schedule: one that isn't on
 * it, or doesn't exist, is a 404, and nothing is written.
 */
async function updateScheduleItem(scheduleItem: ActivityScheduleItemUpdateRequest): Promise<ActivityScheduleItem> {
  const columns = rowMapper.scheduleItems.update.toColumns(scheduleItem);
  const where = [ scheduleItem.activityScheduleId, scheduleItem.entryId, ];

  // mysql2 counts the rows matched, so a PATCH that changes nothing still finds its item
  const found = columns.length > 0
    ? (await db.execQuery<ResultSetHeader>({
      sql: queries.scheduleItems.buildUpdate(columns.map(([ column, ]) => column)),
      params: [ ...columns.map(([ , value, ]) => value), ...where, ],
    })).affectedRows > 0
    : await db.execCountQuery({ sql: queries.scheduleItems.countOnSchedule, params: where, }) > 0;

  if (!found) {
    throw new RowNotFoundError('Activity schedule item not found', {
      activityScheduleId: scheduleItem.activityScheduleId,
      entryId: scheduleItem.entryId,
    });
  }

  return await getScheduleItemById(scheduleItem.entryId);
}

async function deleteScheduleItem(scheduleItem: ActivityScheduleItemDeleteRequest): Promise<void> {
  const query: QueryPayload = {
    sql: queries.scheduleItems.delete,
    params: rowMapper.scheduleItems.delete.toParams(scheduleItem),
  }

  await db.execQuery(query);
}

export default {
  insertSchedule,
  listSchedules,
  getScheduleById,
  updateSchedule,
  deleteSchedule,

  insertScheduleItem,
  getScheduleItemById,
  updateScheduleItem,
  deleteScheduleItem,
}
