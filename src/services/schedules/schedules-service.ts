import { v4 as uuidV4 } from 'uuid';

import datasource from './schedules-mysql-datasource';
import { ensureError, FeralError } from '../../errors';
import {
  ActivitySchedule,
  ActivityScheduleCreateRequest,
  ActivityScheduleItem,
  ActivityScheduleItemCreateRequest
} from './types';

async function createSchedule(scheduleRequest: ActivityScheduleCreateRequest): Promise<ActivitySchedule> {
  try {
    const activityScheduleId = uuidV4();
    return await datasource.insertSchedule(activityScheduleId, scheduleRequest)
  } catch (err) {
    throw new FeralError('Error upserting schedule', ensureError(err))
      .withDebugParams(scheduleRequest);
  }
}

async function getScheduleById(activityScheduleId: string): Promise<ActivitySchedule> {
  try {
    return await datasource.getScheduleById(activityScheduleId);
  } catch (err) {
    throw new FeralError('Error fetching schedule by id', ensureError(err))
      .withDebugParams({ activityScheduleId, });
  }
}

async function listSchedules(): Promise<ActivitySchedule[]> {
  try {
    return await datasource.listSchedules();
  } catch (err) {
    throw new FeralError('Error fetching schedules', ensureError(err));
  }
}

async function addScheduleItem(scheduleItemRequest: ActivityScheduleItemCreateRequest): Promise<ActivityScheduleItem> {
  try {
    const entryId = uuidV4();
    return await datasource.insertScheduleItem(entryId, scheduleItemRequest);
  } catch (err) {
    throw new FeralError('Error adding schedule item', ensureError(err))
      .withDebugParams(scheduleItemRequest);
  }
}

export default {
  createSchedule,
  listSchedules,
  getScheduleById,

  addScheduleItem,
}
