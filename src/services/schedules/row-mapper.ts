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

const scheduleItems = {
  insert: {
    toParams: function(entryId: string, createRequest: ActivityScheduleItemCreateRequest): Array<string | number | null> {
      return [
        createRequest.activityScheduleId,
        entryId,
        createRequest.activityType,
        createRequest.subType ?? null,
        createRequest.recurrenceRule ?? null,
        createRequest.startDate ?? null,
        createRequest.startDateYearOffset,
        createRequest.endDate ?? null,
        createRequest.endDateYearOffset,
        createRequest.notes ?? null,
      ];
    },
  },

  update: {
    toParams: function(updateRequest: ActivityScheduleItemUpdateRequest): Array<string | number | null> {
      return [
        updateRequest.activityType,
        updateRequest.subType ?? null,
        updateRequest.recurrenceRule ?? null,
        updateRequest.startDate ?? null,
        updateRequest.startDateYearOffset,
        updateRequest.endDate ?? null,
        updateRequest.endDateYearOffset,
        updateRequest.notes ?? null,
        updateRequest.entryId,
      ];
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
      startDate: row.start_date,
      startDateYearOffset: row.start_date_year_offset,
      endDate: row.end_date,
      endDateYearOffset: row.end_date_year_offset,
      notes: row.notes,
    };
  },
};

const schedules = {
  insert: {
    toParams: function(activityScheduleId: string, schedule: ActivityScheduleCreateRequest): Array<string | null> {
      return [
        activityScheduleId,
        schedule.name,
        schedule.description ?? null,
      ];
    },
  },

  update: {
    toParams: function(scheduleUpdateRequest: ActivityScheduleUpdateRequest): Array<string | null> {
      return [
        scheduleUpdateRequest.name,
        scheduleUpdateRequest.description ?? null,
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
