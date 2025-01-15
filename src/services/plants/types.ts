import { RowDataPacket } from 'mysql2';

interface Taxonomy {
  family: string,
  genus: string,
  species: string,
}

interface SowingInfo {
  indoor?: string,
  direct?: string,
  germinationDaysRange?: string,
  germinationTempRange?: string,
}

interface PlantingInfo {
  depthInInches?: number,
  plantSpacingInches?: number,
  rowSpacingInches?: number,
  instructions?: string,
}

interface GrowingInfo {
  requiredSun?: string,
  daysToMaturity?: number,
  isClimbing?: boolean,
  climbingHeightFeet?: number,
  plantSize?: string,
}

interface HarvestingInfo {
  fruitSize?: string,
  shelfStability?: string,
  harvestInstructions?: string,
}

export interface PlantRequest {
  plantId: string | undefined,
  category: string,
  friendlyName: string,
  seedSource: string,
  tags: Array<string>,
  description: string,
  taxonomy: Taxonomy,
  sowing: SowingInfo,
  planting: PlantingInfo,
  growing: GrowingInfo,
  harvesting: HarvestingInfo,
}

export interface PlantResponse {
  plantId: string,
  category: string,
  friendlyName: string,
  seedSource: string,
  tags: Array<string>,
  description: string,
  taxonomy: Taxonomy,
  sowing: SowingInfo,
  planting: PlantingInfo,
  growing: GrowingInfo,
  harvesting: HarvestingInfo,
  dateCreated: Date,
  dateModified: Date,
}

export interface PlantRow extends RowDataPacket {
  plant_id: string,
  category: string,
  friendly_name: string,
  seed_source: string,
  tags: string, // JSON string
  plant_description: string,
  family: string,
  genus: string,
  species: string,
  indoor_sowing: string,
  direct_sowing: string,
  germination_days_range: string,
  germination_temp_range: string,
  planting_depth_inches: number,
  plant_spacing_inches: number,
  row_spacing_inches: number,
  planting_instructions: string,
  required_sun: string,
  days_to_maturity: number,
  is_climbing: number,
  climbing_height_feet: number,
  plant_size: string,
  fruit_size: string,
  shelf_stability: string,
  harvest_instructions: string,
  date_created: Date,
  date_modified: Date,
}

export interface Plant {
  plantId: string,
  category: string,
  friendlyName: string,
  seedSource: string,
  tags: Array<string>,
  description: string,
  taxonomy: Taxonomy,
  sowing: SowingInfo,
  planting: PlantingInfo,
  growing: GrowingInfo,
  harvesting: HarvestingInfo,
  dateCreated?: Date,
  dateModified?: Date,
}
