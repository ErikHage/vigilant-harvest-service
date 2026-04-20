import { RowDataPacket } from 'mysql2';

export interface ActivityScheduleCreateRequest {
  name: string,
  description: string,
}

export interface ActivityScheduleUpdateRequest {
  activityScheduleId: string,
  name: string,
  description: string,
}

export interface ActivitySchedule {
  activityScheduleId: string,
  name: string,
  description: string,
  items: ActivityScheduleItem[],
}

export interface ActivityScheduleResponse {
  activityScheduleId: string,
  name: string,
  description: string,
  items: ActivityScheduleItemResponse[],
}

export interface ActivityScheduleRow extends RowDataPacket {
  activity_schedule_id: string,
  name: string,
  description: string,
}

export interface ActivityScheduleItemCreateRequest {
  activityScheduleId: string,
  activityType: string,
  subType: string,
  recurrenceRule: string,
  startDate: string,
  endDate: string,
  notes: string,
}

export interface ActivityScheduleItemUpdateRequest {
  entryId: string,
  activityType: string,
  subType: string,
  recurrenceRule: string,
  startDate: string,
  endDate: string,
  notes: string,
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
  startDate: Date,
  endDate: Date,
  notes: string,
}

export interface ActivityScheduleItemResponse {
  activityScheduleId: string,
  entryId: string,
  activityType: string,
  subType: string,
  recurrenceRule: string,
  startDate: string,
  endDate: string,
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
  end_date: string,
  notes: string,
}
