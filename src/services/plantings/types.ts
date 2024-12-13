import { RowDataPacket } from 'mysql2';

export interface PlantingRequest {
  plantingId: string | undefined,
  plotId: string,
  plantId: string,
  numPlants: number, // int
  plantingYear: number, // int
  notes: string | null,
}

export interface PlantingResponse {
  plantingId: string,
  plotId: string,
  plantId: string,
  numPlants: number, // int
  plantingYear: number, // int
  notes: string | null,
}

export interface Planting {
  plantingId: string,
  plotId: string,
  plantId: string,
  numPlants: number, // int
  plantingYear: number, // int
  notes: string | null,
}

export interface PlantingRow extends RowDataPacket  {
  planting_id: string,
  plot_id: string,
  plant_id: string,
  num_plants: number, // int
  planting_year: number, // int
  notes: string | null,
}
