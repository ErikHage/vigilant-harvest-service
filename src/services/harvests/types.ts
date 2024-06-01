import { RowDataPacket } from 'mysql2';

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

export interface HarvestRow extends RowDataPacket {
  harvest_id: string,
  planting_id: string,
  quantity: number, //int
}
