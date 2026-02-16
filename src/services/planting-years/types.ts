import { RowDataPacket } from 'mysql2';

export interface PlantingYearRequest {
  previousPlantingYear: number, // int
  plantingYear: number, // int
  lastFrostDate: Date,
  targetPlantingDate: Date,
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
