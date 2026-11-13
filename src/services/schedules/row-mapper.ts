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

type ColumnValue = string | number | null;

/** The columns whose field was sent: undefined means left out, and keeps what is stored. */
function sentColumns(columns: Array<[ string, ColumnValue | undefined ]>): Array<[ string, ColumnValue ]> {
  return columns.filter((column): column is [ string, ColumnValue ] => column[1] !== undefined);
}

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
    /** The columns a PATCH writes, each with its value: every field it sent. A null empties its column. */
    toColumns: function(updateRequest: ActivityScheduleItemUpdateRequest): Array<[ string, string | number | null ]> {
      return sentColumns([
        [ 'activity_type', updateRequest.activityType, ],
        [ 'sub_type', updateRequest.subType, ],
        [ 'recurrence_rule', updateRequest.recurrenceRule, ],
        [ 'start_date', updateRequest.startDate, ],
        [ 'start_date_year_offset', updateRequest.startDateYearOffset, ],
        [ 'end_date', updateRequest.endDate, ],
        [ 'end_date_year_offset', updateRequest.endDateYearOffset, ],
        [ 'notes', updateRequest.notes, ],
      ]);
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
    /** As for an item: the columns a PATCH sent, each with its value. */
    toColumns: function(scheduleUpdateRequest: ActivityScheduleUpdateRequest): Array<[ string, string | number | null ]> {
      return sentColumns([
        [ 'name', scheduleUpdateRequest.name, ],
        [ 'description', scheduleUpdateRequest.description, ],
      ]);
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
