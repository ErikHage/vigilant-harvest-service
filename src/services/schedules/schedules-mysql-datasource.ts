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
    ...schedule,
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

async function updateSchedule(scheduleUpdateRequest: ActivityScheduleUpdateRequest): Promise<ActivitySchedule> {
  const query: QueryPayload = {
    sql: queries.schedules.update,
    params: rowMapper.schedules.update.toParams(scheduleUpdateRequest),
  };

  await db.execQuery(query);

  return await getScheduleById(scheduleUpdateRequest.activityScheduleId);
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

async function updateScheduleItem(scheduleItem: ActivityScheduleItemUpdateRequest): Promise<ActivityScheduleItem> {
  const query: QueryPayload = {
    sql: queries.scheduleItems.update,
    params: rowMapper.scheduleItems.update.toParams(scheduleItem),
  }

  await db.execQuery(query);

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

  insertScheduleItem,
  getScheduleItemById,
  updateScheduleItem,
  deleteScheduleItem,
}
