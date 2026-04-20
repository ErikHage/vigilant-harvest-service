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
import mysqlUtils from '../../database/mysql-utils';

const scheduleItems = {
  insert: {
    toParams: function(entryId: string, createRequest: ActivityScheduleItemCreateRequest): Array<string | number> {
      return [
        createRequest.activityScheduleId,
        entryId,
        createRequest.activityType,
        createRequest.subType,
        createRequest.recurrenceRule,
        mysqlUtils.dateToDbString(new Date(createRequest.startDate)),
        mysqlUtils.dateToDbString(new Date(createRequest.endDate)),
        createRequest.notes,
      ];
    },
  },

  update: {
    toParams: function(updateRequest: ActivityScheduleItemUpdateRequest): Array<string | number> {
      return [
        updateRequest.activityType,
        updateRequest.subType,
        updateRequest.recurrenceRule,
        mysqlUtils.dateToDbString(new Date(updateRequest.startDate)),
        mysqlUtils.dateToDbString(new Date(updateRequest.endDate)),
        updateRequest.notes,
        updateRequest.entryId,
      ]
    },
  },

  delete: {
    toParams: function(deleteRequest: ActivityScheduleItemDeleteRequest): Array<string | number> {
      return [
        deleteRequest.activityScheduleId,
        deleteRequest.entryId,
      ]
    },
  },

  fromRow: function(row: ActivityScheduleItemRow): ActivityScheduleItem {
    return {
      activityScheduleId: row.activity_schedule_id,
      entryId: row.entry_id,
      activityType: row.activity_type,
      subType: row.sub_type,
      recurrenceRule: row.recurrence_rule,
      startDate: mysqlUtils.dbDateStringToJsDate(row.start_date),
      endDate: mysqlUtils.dbDateStringToJsDate(row.end_date),
      notes: row.notes,
    };
  },
};

const schedules = {
  insert: {
    toParams: function(activityScheduleId: string, schedule: ActivityScheduleCreateRequest): Array<string> {
      return [
        activityScheduleId,
        schedule.name,
        schedule.description,
      ];
    },
  },

  update: {
    toParams: function(scheduleUpdateRequest: ActivityScheduleUpdateRequest): Array<string> {
      return [
        scheduleUpdateRequest.name,
        scheduleUpdateRequest.description,
        scheduleUpdateRequest.activityScheduleId,
      ];
    },
  },

  list: {
    fromRow: function(row: ActivityScheduleRow): ActivitySchedule {
      return {
        activityScheduleId: row.activity_schedule_id,
        name: row.name,
        description: row.description,
        items: [],
      };
    },
  },

  getById: {
    fromRows: function(row: ActivityScheduleRow, items: ActivityScheduleItemRow[]): ActivitySchedule {
      return {
        activityScheduleId: row.activity_schedule_id,
        name: row.name,
        description: row.description,
        items: items.map(scheduleItems.fromRow),
      };
    },
  },
};

export default {
  schedules,
  scheduleItems,
};
