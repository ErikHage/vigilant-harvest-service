import { RowDataPacket } from 'mysql2';

export interface JournalEntryRequest {
  entryId: string | undefined,
  plantingYear: number, // int
  entry: string,
  entryDate: Date,
}

export interface JournalEntryResponse {
  entryId: string,
  plantingYear: number, // int
  entry: string,
  entryDate: Date,
  dateCreated: Date,
  dateModified: Date,
}

export interface JournalEntry {
  entryId: string,
  plantingYear: number, // int
  entry: string,
  entryDate: Date,
  dateCreated: Date,
  dateModified: Date,
}

export interface JournalEntryRow extends RowDataPacket {
  entry_id: string,
  planting_year: number, // int
  entry: string,
  entry_date: string,
  date_created: string,
  date_modified: string,
}

