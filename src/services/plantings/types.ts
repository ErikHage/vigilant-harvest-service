import { RowDataPacket } from 'mysql2';

export interface PlantingRequest {
  plantingId: string | undefined,
  plantId: string,
  numPlants: number, // int
  coordinates: PlotPlanting[],
}

export interface PlantingResponse {
  plantingId: string,
  plantId: string,
  numPlants: number, // int
  coordinates: PlotPlanting[],
}

export interface Planting {
  plantingId: string,
  plantId: string,
  numPlants: number, // int
  coordinates: PlotPlanting[],
}

export interface PlantingRow extends RowDataPacket  {
  planting_id: string,
  plant_id: string,
  num_plants: number, // int
}

export interface PlotPlanting {
  plotYearId: string,
  plantingId: string,
  xCoordinate: number, // int
  yCoordinate: number, // int
}

export interface PlotPlantingRow extends RowDataPacket {
  plot_year_id: string,
  planting_id: string,
  x_coordinate: number, // int
  y_coordinate: number, // int
}
