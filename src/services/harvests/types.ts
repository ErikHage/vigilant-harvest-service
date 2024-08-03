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

export interface HarvestSummaryRequest {
  plantingYear: number, //int
  // future optional filters?
  // plotId?: string,
  // plantId?: string,
}

export interface HarvestSummary {
  plantingYear: number, //int
  plantingId: string,
  quantity: number, //int
}

export interface HarvestSummaryRow extends RowDataPacket {
  planting_year: number, //int
  planting_id: string,
  quantity: number, //int
}

export interface HarvestSummaryResponse {
  plantingYear: number, //int
  plantingId: string,
  quantity: number, //int
}
