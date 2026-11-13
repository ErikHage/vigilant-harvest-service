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
  clearable,
  ifSent,
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
 * The fields an item is created with. A missing offset is written as 0, its column's default,
 * rather than the NULL its NOT NULL column refuses.
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

/**
 * The fields a PATCH sends. One left out keeps what is stored, and one sent as null, or '', is
 * cleared. The type can't be empty, so it can't be cleared, and an offset sent as null is 0, as on
 * create.
 */
function itemUpdateFields(req: Request) {
  const body = bodyOf(req);

  return {
    activityType: ifSent(body.activityType, value => requiredString(value, 'activityType', NAME)),
    subType: clearable(body.subType, value => optionalString(value, 'subType', NAME)),
    recurrenceRule: clearable(body.recurrenceRule, value => optionalString(value, 'recurrenceRule', NAME)),
    startDate: clearable(body.startDate, value => optionalMonthDay(value, 'startDate')),
    startDateYearOffset: ifSent(body.startDateYearOffset,
      value => optionalInteger(value, 'startDateYearOffset', YEAR_OFFSET) ?? 0),
    endDate: clearable(body.endDate, value => optionalMonthDay(value, 'endDate')),
    endDateYearOffset: ifSent(body.endDateYearOffset,
      value => optionalInteger(value, 'endDateYearOffset', YEAR_OFFSET) ?? 0),
    notes: clearable(body.notes, value => optionalString(value, 'notes', TEXT)),
  };
}

/** A new schedule's fields. */
function scheduleFields(req: Request) {
  const body = bodyOf(req);

  return {
    name: requiredString(body.name, 'name', NAME),
    description: optionalString(body.description, 'description', TEXT),
  };
}

/** As for an item: left out keeps what is stored, and null or '' clears it, but the name can't be empty. */
function scheduleUpdateFields(req: Request) {
  const body = bodyOf(req);

  return {
    name: ifSent(body.name, value => requiredString(value, 'name', NAME)),
    description: clearable(body.description, value => optionalString(value, 'description', TEXT)),
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
      activityScheduleId: req.params.activityScheduleId!,
      entryId: req.params.entryId!,
      ...itemUpdateFields(req),
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
      ...scheduleUpdateFields(req),
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
