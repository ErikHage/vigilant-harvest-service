import { RowDataPacket } from 'mysql2';
import { StatsType } from '../../types/stats-type';

export interface HarvestRequest {
  harvestId: string | undefined,
  plantingId: string,
  quantity: number, //int
  harvestDate: Date,
  harvestTypeId?: number, //int, overrides the plant's default when supplied
}

export interface HarvestResponse {
  harvestId: string,
  plantingId: string,
  quantity: number, //int
  harvestDate: Date,
  harvestTypeId: number, //int
  harvestType: string,
}

export interface Harvest {
  harvestId: string,
  plantingId: string,
  quantity: number, //int
  harvestDate: Date,
  harvestTypeId: number, //int
  harvestType: string,
}

// what the write path needs: the harvest type name is resolved by re-reading after the upsert
export interface HarvestUpsertInstruction {
  harvestId: string,
  plantingId: string,
  plantingYear: number, // int; only written for a new harvest
  quantity: number, //int
  harvestDate: Date,
  harvestTypeId: number, //int
  // set when retyping an existing harvest onto a day that already holds one of the new type: its
  // quantity moves to that harvest and this row is deleted in the same transaction
  absorbedHarvestId?: string,
}

export interface HarvestRow extends RowDataPacket {
  harvest_id: string,
  planting_id: string,
  quantity: number, //int
  date_created: string,
  harvest_type_id: number, //int
  harvest_type_name: string,
}

export interface HydratedHarvest {
  harvestId: string,
  plantingId?: string,
  plantingName?: string,
  plantId: string,
  plantName: string,
  plotName: string,
  quantity: number, //int
  harvestDate: Date,
  harvestTypeId: number, //int
  harvestType: string,
}

export interface HydratedHarvestRow extends RowDataPacket {
  harvest_id: string,
  planting_id: string,
  planting_name: string,
  plant_id: string,
  plant_name: string,
  plot_name: string,
  quantity: number, //int
  date_created: string,
  harvest_type_id: number, //int
  harvest_type_name: string,
}

export interface DefaultHarvestTypeRow extends RowDataPacket {
  default_harvest_type_id: number, //int
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
  harvestTypeId: number, //int
  harvestType: string,
}

export interface HarvestSummaryRow extends RowDataPacket {
  planting_year: number, //int
  planting_id: string,
  quantity: string, //int, but SUM returns a decimal, which mysql2 represents as a string
  harvest_type_id: number, //int
  harvest_type_name: string,
}

export interface HarvestSummaryResponse {
  plantingYear: number, //int
  plantingId: string,
  quantity: number, //int
  harvestTypeId: number, //int
  harvestType: string,
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
  plotName?: string,
  harvestTypeId: number, // int
  harvestType: string,
  totalQuantity: number, // int
  averageHarvestPerDay: number // int
  firstHarvest: Date | null,
  lastHarvest: Date | null,
}

export interface PlantingYearRow extends RowDataPacket {
  current_planting_year: number,
}
