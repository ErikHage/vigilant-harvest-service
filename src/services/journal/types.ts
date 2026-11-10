import { RowDataPacket } from 'mysql2';

export interface JournalEntryRequest {
  entryId: string | undefined,
  plantingYear: number, // int
  entry: string | null,
  entryDate: string, // YYYY-MM-DDTHH:mm:ss, the user's own wall-clock time
}

export interface JournalEntryResponse {
  entryId: string,
  plantingYear: number, // int
  entry: string,
  entryDate: string,
  dateCreated: string,
  dateModified: string,
}

export interface JournalEntry {
  entryId: string,
  plantingYear: number, // int
  entry: string,
  entryDate: string,
  dateCreated: string,
  dateModified: string,
}

export interface JournalEntryRow extends RowDataPacket {
  entry_id: string,
  planting_year: number, // int
  entry: string,
  entry_date: string,
  date_created: string,
  date_modified: string,
}

