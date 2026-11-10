import { RowDataPacket } from 'mysql2';

export interface PlantingYearRequest {
  previousPlantingYear?: number, // int; none carries nothing forward
  plantingYear: number, // int
  lastFrostDate: string, // YYYY-MM-DD
  targetPlantingDate: string, // YYYY-MM-DD
}

/** What is written for a new year; it is read back as a PlantingYear. */
export interface NewPlantingYear {
  plantingYear: number, // int
  lastFrostDate: string, // YYYY-MM-DD
  targetPlantingDate: string, // YYYY-MM-DD
}

export interface PlantingYear {
  plantingYear: number, // int
  lastFrostDate: Date,
  targetPlantingDate: Date,
  details?: PlantingYearDetails, // TODO DEPRECATED - remove
}

export interface PlantingYearRow extends RowDataPacket  {
  planting_year: number, // int
  last_frost_date: string,
  target_planting_date: string,
}

export interface PlantingYearResponse {
  plantingYear: number, // int
  lastFrostDate: Date,
  targetPlantingDate: Date,
  details: PlantingYearDetails,
}

export interface PlantingYearDetails {
  createdPlantings: number,
  startedPlantings: number,
  plantedPlantings: number,
  retiredPlantings: number,
}

export interface PlantingsBreakdown {
  numberCreated: number,
  numberStarted: number,
  numberPlanted: number,
  numberRetired: number,
}

export interface PlantingsBreakdownRow extends RowDataPacket {
  planting_year: number,
  planting_status: string,
  status_count: number,
}

export interface PlantingYearUsage {
  plantings: number,
  plantingMappings: number,
  harvests: number,
  journalEntries: number,
  activityLogEntries: number,
}

export interface PlantingYearUsageRow extends RowDataPacket {
  plantings: number,
  planting_mappings: number,
  harvests: number,
  journal_entries: number,
  activity_log_entries: number,
}
