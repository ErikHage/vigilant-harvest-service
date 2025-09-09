import { RowDataPacket } from 'mysql2';
import { StatsType } from '../../types/stats-type';

export interface HarvestRequest {
  harvestId: string | undefined,
  plantingId: string,
  quantity: number, //int
  harvestDate: Date,
}

export interface HarvestResponse {
  harvestId: string,
  plantingId: string,
  quantity: number, //int
  harvestDate: Date,
}

export interface Harvest {
  harvestId: string,
  plantingId: string,
  quantity: number, //int
  harvestDate: Date,
}

export interface HarvestRow extends RowDataPacket {
  harvest_id: string,
  planting_id: string,
  quantity: number, //int
  date_created: string,
}

export interface HydratedHarvest {
  harvestId: string,
  plantingId?: string,
  plantingName?: string,
  plantId: string,
  plantName: string,
  quantity: number, //int
  harvestDate: Date,
}

export interface HydratedHarvestRow extends RowDataPacket {
  harvest_id: string,
  planting_id: string,
  plant_name: string,
  quantity: number, //int
  date_created: string,
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
  quantity: string, //int, but SUM returns a decimal, which mysql2 represents as a string
}

export interface HarvestSummaryResponse {
  plantingYear: number, //int
  plantingId: string,
  quantity: number, //int
}

export interface HarvestSearchRequest {
  year: number, // int
}

export interface HarvestStatsRequest {
  type: StatsType,
  year: number, // int
}

export interface HarvestStats {
  firstHarvestDate: Date | null,
  lastHarvestDate: Date | null,
  numberOfHarvests: number, // int
  numberOfDays: number, // int
  statsType: StatsType,
  stats: ItemStats[],
}

export interface HarvestStatsResponse {
  firstHarvestDate: Date | null,
  lastHarvestDate: Date | null,
  numberOfHarvests: number, // int
  numberOfDays: number, // int
  statsType: StatsType,
  stats: ItemStats[],
}

export interface ItemStats {
  plantingId?: string,
  plantingName?: string,
  plantId: string,
  plantName: string,
  totalQuantity: number, // int
  averageHarvestPerDay: number // int
  firstHarvest: Date | null,
  lastHarvest: Date | null,
}
