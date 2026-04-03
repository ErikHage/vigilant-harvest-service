import { QueryPayload } from '../../database/types';
import queries from '../schedules/queries';
import rowMapper from '../schedules/row-mapper';
import db, { RowNotFoundError } from '../../database';
import {
  ActivitySchedule,
  ActivityScheduleCreateRequest,
  ActivityScheduleItem,
  ActivityScheduleItemCreateRequest,
  ActivityScheduleItemRow,
  ActivityScheduleRow
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

  if (scheduleResults.length === 1) {
    throw new RowNotFoundError('Activity schedule not found', { activityScheduleId, });
  }

  const itemResults: ActivityScheduleItemRow[] = await db.execQuery<ActivityScheduleItemRow[]>(itemsQuery);

  return rowMapper.schedules.getById.fromRows(scheduleResults[0]!, itemResults);
}

async function insertScheduleItem(entryId: string, scheduleItem: ActivityScheduleItemCreateRequest): Promise<ActivityScheduleItem> {
  const query: QueryPayload = {
    sql: queries.scheduleItems.insert,
    params: rowMapper.scheduleItems.insert.toParams(entryId, scheduleItem),
  }

  await db.execQuery(query);

  return {
    ...scheduleItem,
    entryId,
  };
}

export default {
  insertSchedule,
  listSchedules,
  getScheduleById,

  insertScheduleItem,
}
