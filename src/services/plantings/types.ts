import { RowDataPacket } from 'mysql2';

export interface PlantingRequest {
  plantingId: string | undefined,
  plotId: string,
  plantId: string,
  numPlants: number, // int
  plantingYear: number, // int
  name: string,
  notes: string[],
}

export interface PlantingResponse {
  plantingId: string,
  plotId: string,
  plantId: string,
  numPlants: number, // int
  plantingYear: number, // int
  name: string,
  notes: string[],
}

export interface Planting {
  plantingId: string,
  plotId: string,
  plantId: string,
  numPlants: number, // int
  plantingYear: number, // int
  name: string,
  notes: string[],
}

export interface PlantingRow extends RowDataPacket  {
  planting_id: string,
  plot_id: string,
  plant_id: string,
  num_plants: number, // int
  planting_year: number, // int
  planting_name: string,
  notes: string | null,
}
