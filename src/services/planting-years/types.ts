import { RowDataPacket } from 'mysql2';

export interface PlantingYear {
  plantingYear: number, // int
}

export interface PlantingYearRow extends RowDataPacket  {
  planting_year: number, // int
}
