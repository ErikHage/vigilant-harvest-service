import { RowDataPacket } from 'mysql2';
import { StatsType } from '../../types/stats-type';

export interface HarvestRequest {
  harvestId: string | undefined,
  plantingId: string,
  quantity: number, // to the hundredth
  harvestDate: string, // YYYY-MM-DD, the user's own day
  harvestTypeId?: number, //int, overrides the plant's default when supplied
}

export interface HarvestResponse {
  harvestId: string,
  plantingId: string,
  quantity: number, // to the hundredth
  harvestDate: string,
  harvestTypeId: number, //int
  harvestType: string,
}

export interface Harvest {
  harvestId: string,
  plantingId: string,
  quantity: number, // to the hundredth
  harvestDate: string,
  harvestTypeId: number, //int
  harvestType: string,
}

/**
 * What the write path needs: the harvest type name is resolved by re-reading after the save. Each is
 * inserted, or its quantity is added to the harvest its planting already has on that day of that
 * type: the database's key decides, so harvests saved together, or in saves at once, fold.
 */
export interface HarvestUpsertInstruction {
  harvestId: string,
  plantingId: string,
  plantingYear: number, // int; an existing harvest keeps the year it was filed under
  quantity: number, // to the hundredth
  harvestDate: string, // YYYY-MM-DD
  harvestTypeId: number, //int
  /** An existing harvest: its row is deleted first, in the same transaction, and written again. */
  replacesStoredHarvest: boolean,
  /** An existing harvest's, kept when it's written again; a new one's is the database's own. */
  dateCreated?: string,
}

/** A harvest as it's stored, with what the write path keeps when it writes one again. */
export interface StoredHarvest extends Harvest {
  plantingYear: number, // int
  dateCreated: string, // as mysql2 reads it, with dateStrings
}

export interface HarvestRow extends RowDataPacket {
  harvest_id: string,
  planting_id: string,
  quantity: string, // DECIMAL(8,2), which mysql2 represents as a string
  harvest_date: string, // YYYY-MM-DD
  harvest_type_id: number, //int
  harvest_type_name: string,
}

export interface StoredHarvestRow extends HarvestRow {
  planting_year: number, //int
  date_created: string,
}

export interface HydratedHarvest {
  harvestId: string,
  plantingId?: string,
  plantingName?: string,
  plantId: string,
  plantName: string,
  plotName: string,
  quantity: number, // to the hundredth
  harvestDate: string,
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
  quantity: string, // DECIMAL(8,2), which mysql2 represents as a string
  harvest_date: string, // YYYY-MM-DD
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
  quantity: number, // to the hundredth
  harvestTypeId: number, //int
  harvestType: string,
}

export interface HarvestSummaryRow extends RowDataPacket {
  planting_year: number, //int
  planting_id: string,
  quantity: string, // SUM of a DECIMAL(8,2), which mysql2 represents as a string
  harvest_type_id: number, //int
  harvest_type_name: string,
}

export interface HarvestSummaryResponse {
  plantingYear: number, //int
  plantingId: string,
  quantity: number, // to the hundredth
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
  firstHarvestDate: string | null,
  lastHarvestDate: string | null,
  numberOfHarvests: number, // int
  numberOfDays: number, // int
  statsType: StatsType,
  stats: ItemStats[],
}

export interface HarvestStatsResponse {
  firstHarvestDate: string | null,
  lastHarvestDate: string | null,
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
  firstHarvest: string | null,
  lastHarvest: string | null,
}

export interface PlantingYearRow extends RowDataPacket {
  current_planting_year: number,
}
