import { RowDataPacket } from 'mysql2';

export interface ActivityLogEntryRequest {
  entryId: string | undefined,
  plantingYear: number, // int
  entryDate: Date,
  activityType: string,
  subType: string,
  comments: string,
}

export interface ActivityLogEntryResponse {
  entryId: string,
  plantingYear: number, // int
  entryDate: Date,
  activityType: string,
  subType: string,
  comments: string,
  dateCreated: Date,
  dateModified: Date,
}

export interface ActivityLogEntry {
  entryId: string,
  plantingYear: number, // int
  entryDate: Date,
  activityType: string,
  subType: string,
  comments: string,
  dateCreated: Date,
  dateModified: Date,
}

export interface ActivityLogEntryRow extends RowDataPacket {
  entry_id: string,
  planting_year: number, // int
  entry_date: string,
  activity_type: string,
  sub_type: string,
  comments: string,
  date_created: string,
  date_modified: string,
}

