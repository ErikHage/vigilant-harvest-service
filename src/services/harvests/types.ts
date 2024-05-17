export interface HarvestRequest {
  harvestId: string | undefined,
  plantingId: string,
  quantity: number, //int
}

export interface HarvestResponse {
  harvestId: string,
  plantingId: string,
  quantity: number, //int
}

export interface Harvest {
  harvestId: string,
  plantingId: string,
  quantity: number, //int
}
