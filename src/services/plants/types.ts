import { RowDataPacket } from 'mysql2';
import { ActivitySchedule, ActivityScheduleResponse } from '../schedules/types';

interface Taxonomy {
  family?: string,
  genus?: string,
  species?: string,
  cultivar?: string,
}

interface SowingInfo {
  indoor?: string,
  direct?: string,
  germinationDaysRange?: string,
  germinationTempRange?: string,
  sowingNotes?: string,
}

interface PlantingInfo {
  depthInInches?: number | null,
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
  growingNotes?: string,
}

interface HarvestingInfo {
  defaultHarvestTypeId: number, // int
  defaultHarvestType?: string, // the name, joined from harvest_types on read only
  fruitSize?: string,
  shelfStability?: string,
  harvestInstructions?: string,
}

export interface PlantRequest {
  plantId: string | undefined,
  subcategoryId: number,
  friendlyName: string,
  lifespanType: string,
  tags: Array<string>,
  description?: string,
  taxonomy: Taxonomy,
  sowing: SowingInfo,
  planting: PlantingInfo,
  growing: GrowingInfo,
  harvesting: HarvestingInfo,
}

export interface PlantScheduleAssignmentRequest {
  plantId: string,
  assign: string[], // activityScheduleId
  unassign: string[], // activityScheduleId
}

export interface PlantResponse {
  plantId: string,
  category: string,
  categoryId: number,
  subcategory: string,
  subcategoryId: number,
  friendlyName: string,
  lifespanType: string,
  tags: Array<string>,
  description: string,
  activitySchedules: ActivityScheduleResponse[],
  taxonomy: Taxonomy,
  sowing: SowingInfo,
  planting: PlantingInfo,
  growing: GrowingInfo,
  harvesting: HarvestingInfo,
  dateCreated: string,
  dateModified: string,
}

export interface PlantRow extends RowDataPacket {
  plant_id: string,
  category_name: string,
  subcategory_name: string,
  friendly_name: string,
  lifespan_type: string,
  tags: string, // JSON string
  plant_description: string,
  family: string,
  genus: string,
  species: string,
  cultivar: string,
  indoor_sowing: string,
  direct_sowing: string,
  germination_days_range: string,
  germination_temp_range: string,
  sowing_notes: string,
  planting_depth_inches: string | null,
  plant_spacing_inches: number,
  row_spacing_inches: number,
  planting_instructions: string,
  required_sun: string,
  days_to_maturity: number,
  is_climbing: number,
  climbing_height_feet: number,
  plant_size: string,
  growing_notes: string,
  default_harvest_type_id: number, // int
  default_harvest_type_name: string,
  fruit_size: string,
  shelf_stability: string,
  harvest_instructions: string,
  date_created: string,
  date_modified: string,
}

export interface Plant {
  plantId: string,
  category: string,
  categoryId: number,
  subcategory: string,
  subcategoryId: number,
  friendlyName: string,
  lifespanType: string,
  tags: Array<string>,
  description: string,
  activitySchedules: ActivitySchedule[],
  taxonomy: Taxonomy,
  sowing: SowingInfo,
  planting: PlantingInfo,
  growing: GrowingInfo,
  harvesting: HarvestingInfo,
  dateCreated?: string,
  dateModified?: string,
}

export interface PlantUpsertInstruction {
  plantId: string,
  subcategoryId: number,
  friendlyName: string,
  lifespanType: string,
  tags: Array<string>,
  description?: string,
  taxonomy: Taxonomy,
  sowing: SowingInfo,
  planting: PlantingInfo,
  growing: GrowingInfo,
  harvesting: HarvestingInfo,
  dateCreated?: string,
  dateModified?: string,
}

export interface CategorySubcategoryRow extends RowDataPacket {
  category_id: number, // int
  category_name: string,
  subcategory_id?: number, // int
  subcategory_name?: string
}

export interface PlantCategoryRequest {
  categoryName: string,
}

export interface PlantCategory {
  categoryId: number, // int
  categoryName: string,
  subcategories: PlantSubcategory[],
}

export interface PlantCategoryResponse {
  categoryId: number, // int
  categoryName: string,
  subcategories: PlantSubcategoryResponse[],
}

export interface PlantSubcategoryRequest {
  categoryId: number, // int
  subcategoryName: string,
}

export interface PlantSubcategory {
  categoryId: number, // int
  subcategoryId: number, // int
  subcategoryName: string,
}

export interface PlantSubcategoryResponse {
  categoryId: number, // int
  subcategoryId: number, // int
  subcategoryName: string,
}
