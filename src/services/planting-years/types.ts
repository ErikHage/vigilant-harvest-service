import { RowDataPacket } from 'mysql2';

export interface PlantingYearRequest {
  plantingYear: number, // int
  lastFrostDate: Date,
  targetPlantingDate: Date,
}


export interface PlantingYear {
  plantingYear: number, // int
  lastFrostDate: Date,
  targetPlantingDate: Date,
}

export interface PlantingYearRow extends RowDataPacket  {
  planting_year: number, // int
  last_frost_date: Date,
  target_planting_date: Date,
}

export interface PlantingYearResponse {
  plantingYear: number, // int
  lastFrostDate: Date,
  targetPlantingDate: Date,
}
