import { Request } from 'express';
import {
  ActivitySchedule,
  ActivityScheduleCreateRequest, ActivityScheduleItem,
  ActivityScheduleItemCreateRequest, ActivityScheduleItemResponse,
  ActivityScheduleResponse, ActivityScheduleUpdateRequest
} from '../services/schedules/types';

const scheduleItems = {
  fromCreateRequest: function(req: Request): ActivityScheduleItemCreateRequest {
    return {
      activityScheduleId: req.params.activityScheduleId!,
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
      startDate: scheduleItem.startDate.toISOString(),
      endDate: scheduleItem.endDate.toISOString(),
      notes: scheduleItem.notes,
    };
  },
};

const schedules = {
  fromCreateRequest: function(req: Request): ActivityScheduleCreateRequest {
    return {
      name: req.body.name,
      description: req.body.description,
    };
  },

  fromUpdateRequest: function(req: Request): ActivityScheduleUpdateRequest {
    return {
      activityScheduleId: req.params.activityScheduleId!,
      name: req.body.name,
      description: req.body.description,
    };
  },

  toResponse: function(schedule: ActivitySchedule): ActivityScheduleResponse {
    return {
      activityScheduleId: schedule.activityScheduleId,
      name: schedule.name,
      description: schedule.description,
      items: schedule.items.map(scheduleItems.toResponse),
    };
  },
};

export default {
  schedules,
  scheduleItems,
};
