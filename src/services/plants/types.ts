export interface PlantRequest {
  plantId: string | undefined,
  family: string,
  genus: string,
  species: string,
}

export interface PlantResponse {
  plantId: string,
  family: string,
  genus: string,
  species: string,
}

export interface Plant {
  plantId: string,
  family: string,
  genus: string,
  species: string,
}
