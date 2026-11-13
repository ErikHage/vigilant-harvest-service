import { RowDataPacket } from 'mysql2';

export interface ActivityScheduleCreateRequest {
  name: string,
  description?: string,
}

/** A field left out is undefined, and keeps what is stored; one that is null is cleared. */
export interface ActivityScheduleUpdateRequest {
  activityScheduleId: string,
  name?: string,
  description?: string | null,
}

export interface ActivitySchedule {
  activityScheduleId: string,
  name: string,
  description: string | null,
  items: ActivityScheduleItem[],
}

export interface ActivityScheduleResponse {
  activityScheduleId: string,
  name: string,
  description: string | null,
  items: ActivityScheduleItemResponse[],
}

export interface ActivityScheduleRow extends RowDataPacket {
  activity_schedule_id: string,
  name: string,
  description: string | null, // TEXT, nullable
}

export interface ActivityScheduleItemCreateRequest {
  activityScheduleId: string,
  activityType: string,
  subType?: string,
  recurrenceRule?: string,
  startDate?: string, // MM-DD
  startDateYearOffset: number,
  endDate?: string, // MM-DD
  endDateYearOffset: number,
  notes?: string,
}

/** As ActivityScheduleUpdateRequest. The item must be on the path's schedule. */
export interface ActivityScheduleItemUpdateRequest {
  activityScheduleId: string,
  entryId: string,
  activityType?: string,
  subType?: string | null,
  recurrenceRule?: string | null,
  startDate?: string | null, // MM-DD
  startDateYearOffset?: number,
  endDate?: string | null, // MM-DD
  endDateYearOffset?: number,
  notes?: string | null,
}

export interface ActivityScheduleItemDeleteRequest {
  activityScheduleId: string,
  entryId: string,
}

export interface ActivityScheduleItem {
  activityScheduleId: string,
  entryId: string,
  activityType: string,
  subType: string,
  recurrenceRule: string,
  startDate: string,
  startDateYearOffset: number,
  endDate: string,
  endDateYearOffset: number,
  notes: string,
}

export interface ActivityScheduleItemResponse {
  activityScheduleId: string,
  entryId: string,
  activityType: string,
  subType: string,
  recurrenceRule: string,
  startDate: string,
  startDateYearOffset: number,
  endDate: string,
  endDateYearOffset: number,
  notes: string,
}

export interface ActivityScheduleItemRow extends RowDataPacket {
  activity_schedule_id: string,
  schedule_name: string,
  schedule_description: string,
  entry_id: string,
  activity_type: string,
  sub_type: string,
  recurrence_rule: string,
  start_date: string,
  start_date_year_offset: number,
  end_date: string,
  end_date_year_offset: number,
  notes: string,
}
