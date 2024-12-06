import { RowDataPacket } from 'mysql2';

export interface PlantingYearRequest {
  plantingYear: number, // int
}


export interface PlantingYear {
  plantingYear: number, // int
}

export interface PlantingYearRow extends RowDataPacket  {
  planting_year: number, // int
}
