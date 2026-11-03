import { Request } from 'express';
import {
  ActivitySchedule,
  ActivityScheduleCreateRequest,
  ActivityScheduleItem,
  ActivityScheduleItemCreateRequest,
  ActivityScheduleItemDeleteRequest,
  ActivityScheduleItemResponse,
  ActivityScheduleItemUpdateRequest,
  ActivityScheduleResponse,
  ActivityScheduleUpdateRequest
} from '../services/schedules/types';
import {
  bodyOf,
  optionalInteger,
  optionalMonthDay,
  optionalString,
  requiredString,
  TEXT_BYTES
} from '../validation';

const NAME = { maxLength: 255, };
const TEXT = { maxBytes: TEXT_BYTES, };
/** The app's offsets: the previous, current and next year. */
const YEAR_OFFSET = { min: -1, max: 1, };

/**
 * The fields an item is created or updated with. PATCH writes every one of them today, a pinned
 * behaviour, so the type is required on both, and a missing offset is written as 0, its column's
 * default, rather than the NULL its NOT NULL column refuses.
 */
function itemFields(req: Request) {
  const body = bodyOf(req);

  return {
    activityType: requiredString(body.activityType, 'activityType', NAME),
    subType: optionalString(body.subType, 'subType', NAME),
    recurrenceRule: optionalString(body.recurrenceRule, 'recurrenceRule', NAME),
    startDate: optionalMonthDay(body.startDate, 'startDate'),
    startDateYearOffset: optionalInteger(body.startDateYearOffset, 'startDateYearOffset', YEAR_OFFSET) ?? 0,
    endDate: optionalMonthDay(body.endDate, 'endDate'),
    endDateYearOffset: optionalInteger(body.endDateYearOffset, 'endDateYearOffset', YEAR_OFFSET) ?? 0,
    notes: optionalString(body.notes, 'notes', TEXT),
  };
}

/** A schedule's fields. PATCH writes both today, so the name is required on an update too. */
function scheduleFields(req: Request) {
  const body = bodyOf(req);

  return {
    name: requiredString(body.name, 'name', NAME),
    description: optionalString(body.description, 'description', TEXT),
  };
}

const scheduleItems = {
  fromCreateRequest: function(req: Request): ActivityScheduleItemCreateRequest {
    return {
      activityScheduleId: req.params.activityScheduleId!,
      ...itemFields(req),
    };
  },

  fromUpdateRequest: function(req: Request): ActivityScheduleItemUpdateRequest {
    return {
      entryId: req.params.entryId!,
      ...itemFields(req),
    };
  },

  fromDeleteRequest: function(req: Request): ActivityScheduleItemDeleteRequest {
    return {
      activityScheduleId: req.params.activityScheduleId!,
      entryId: req.params.entryId!,
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
      startDateYearOffset: scheduleItem.startDateYearOffset,
      endDate: scheduleItem.endDate,
      endDateYearOffset: scheduleItem.endDateYearOffset,
      notes: scheduleItem.notes,
    };
  },
};

const schedules = {
  fromCreateRequest: function(req: Request): ActivityScheduleCreateRequest {
    return scheduleFields(req);
  },

  fromUpdateRequest: function(req: Request): ActivityScheduleUpdateRequest {
    return {
      activityScheduleId: req.params.activityScheduleId!,
      ...scheduleFields(req),
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
