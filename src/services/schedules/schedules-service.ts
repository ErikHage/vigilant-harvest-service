import { v4 as uuidV4 } from 'uuid';

import datasource from './schedules-mysql-datasource';
import { ensureError, FeralError } from '../../errors';
import {
  ActivitySchedule,
  ActivityScheduleCreateRequest,
  ActivityScheduleItem,
  ActivityScheduleItemCreateRequest, ActivityScheduleItemUpdateRequest, ActivityScheduleUpdateRequest
} from './types';

async function createSchedule(scheduleRequest: ActivityScheduleCreateRequest): Promise<ActivitySchedule> {
  try {
    const activityScheduleId = uuidV4();
    return await datasource.insertSchedule(activityScheduleId, scheduleRequest);
  } catch (err) {
    throw new FeralError('Error inserting schedule', ensureError(err))
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

async function updateSchedule(scheduleUpdateRequest: ActivityScheduleUpdateRequest): Promise<ActivitySchedule> {
  try {
    return await datasource.updateSchedule(scheduleUpdateRequest);
  } catch (err) {
    throw new FeralError('Error updating schedule', ensureError(err))
      .withDebugParams(scheduleUpdateRequest);
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

async function updateScheduleItem(scheduleItemUpdateRequest: ActivityScheduleItemUpdateRequest): Promise<ActivityScheduleItem> {
  try {
    return await datasource.updateScheduleItem(scheduleItemUpdateRequest);
  } catch (err) {
    throw new FeralError('Error updating schedule item', ensureError(err))
      .withDebugParams(scheduleItemUpdateRequest);
  }
}

export default {
  createSchedule,
  listSchedules,
  getScheduleById,
  updateSchedule,

  addScheduleItem,
  updateScheduleItem,
}
