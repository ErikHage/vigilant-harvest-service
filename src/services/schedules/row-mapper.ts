import {
  ActivitySchedule,
  ActivityScheduleCreateRequest,
  ActivityScheduleItemCreateRequest,
  ActivityScheduleRow
} from './types';

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
};

const scheduleItems = {
  insert: {
    toParams: function(entryId: string, scheduleItem: ActivityScheduleItemCreateRequest): Array<string | number> {
      return [
        scheduleItem.activityScheduleId,
        entryId,
        scheduleItem.activityType,
        scheduleItem.subType,
        scheduleItem.recurrenceRule,
        scheduleItem.startDate,
        scheduleItem.endDate,
        scheduleItem.notes,
      ];
    },
  },
};

export default {
  schedules,
  scheduleItems,
};
