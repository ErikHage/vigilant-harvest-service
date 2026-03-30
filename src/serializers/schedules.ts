import { Request } from 'express';
import {
  ActivitySchedule,
  ActivityScheduleCreateRequest, ActivityScheduleItem,
  ActivityScheduleItemCreateRequest, ActivityScheduleItemResponse,
  ActivityScheduleResponse
} from '../services/schedules/types';

const schedules = {
  fromCreateRequest: function(req: Request): ActivityScheduleCreateRequest {
    return {
      name: req.body.name,
      description: req.body.description,
    };
  },

  toResponse: function(schedule: ActivitySchedule): ActivityScheduleResponse {
    return {
      activityScheduleId: schedule.activityScheduleId,
      name: schedule.name,
      description: schedule.description,
      items: schedule.items,
    };
  },
};

const scheduleItems = {
  fromCreateRequest: function(req: Request): ActivityScheduleItemCreateRequest {
    return {
      activityScheduleId: req.params.scheduleId!,
      activityType: req.body.activityType,
      subType: req.body.subType,
      recurrenceRule: req.body.recurrenceRule,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      notes: req.body.notes,
    };
  },

  toResponse: function(scheduleItem: ActivityScheduleItem): ActivityScheduleItemResponse {
    return {
      activityScheduleId: scheduleItem.activityScheduleId,
      entryId: scheduleItem.entryId,
      activityType: scheduleItem.activityType,
      subType: scheduleItem.subType,
      recurrenceRule: scheduleItem.recurrenceRule,
      startDate: scheduleItem.startDate,
      endDate: scheduleItem.endDate,
      notes: scheduleItem.notes,
    };
  },
};

export default {
  schedules,
  scheduleItems,
};
