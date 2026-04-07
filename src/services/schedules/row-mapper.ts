import {
  ActivitySchedule,
  ActivityScheduleCreateRequest, ActivityScheduleItem,
  ActivityScheduleItemCreateRequest, ActivityScheduleItemRow,
  ActivityScheduleRow
} from './types';
import mysqlUtils from '../../database/mysql-utils';

const scheduleItems = {
  insert: {
    toParams: function(entryId: string, scheduleItem: ActivityScheduleItemCreateRequest): Array<string | number> {
      return [
        scheduleItem.activityScheduleId,
        entryId,
        scheduleItem.activityType,
        scheduleItem.subType,
        scheduleItem.recurrenceRule,
        mysqlUtils.dateToDbString(new Date(scheduleItem.startDate)),
        mysqlUtils.dateToDbString(new Date(scheduleItem.endDate)),
        scheduleItem.notes,
      ];
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
