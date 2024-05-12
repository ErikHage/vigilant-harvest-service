export interface PlotPlanting {
  plotYearId: string,
  plantingId: string,
  xCoordinate: number, // int
  yCoordinate: number, // int
}

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
