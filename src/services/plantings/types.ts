import { RowDataPacket } from 'mysql2';

export interface CreatePlantingRequest {
  plantId: string,
  plantingYear: number, // int
  name: string,
  targetPlantingDate?: string, // YYYY-MM-DD
  leadTimeWeeks?: number, // int
  seedSource?: string,
  lotNumber?: string,
}

export interface PerformActionRequest {
  plantingId: string,
  actionType: string,
  sowActionData?: SowActionData,
  splitActionData?: SplitActionData,
  transplantActionData?: TransplantActionData,
  retireActionData?: RetireActionData,
  commentActionData?: CommentActionData,
}

export interface SowActionData {
  sowDate: string, // YYYY-MM-DD
  numberSown?: number, // int
  comment: string
}

export interface TransplantActionData {
  plotId?: string,
  transplantDate: string, // YYYY-MM-DD
  numberTransplanted?: number, // int
  comment: string
}

export interface SplitActionData {
  sourcePlantingId?: string, // the service uses the planting in the path
  comment: string,
  splits: SplitData[],
}

export interface SplitData {
  name: string,
  count: number, // int
}

export interface RetireActionData {
  comment: string
}

export interface CommentActionData {
  comment: string,
}

export interface PlantingResponse {
  plantingId: string,
  plotId?: string,
  plantId: string,
  numberTransplanted?: number, // int
  currentPlantingYear: number, // int
  plantingYears: number[], // int
  name: string,
  seedSource?: string,
  lotNumber?: string,
  targetPlantingDate?: string, // YYYY-MM-DD
  leadTimeWeeks?: number, // int
  sowDate?: string, // YYYY-MM-DD
  sowType?: string,
  numberSown?: number, //int
  transplantDate?: string, // YYYY-MM-DD
  currentStatus?: string,
  notes?: string,
  dateCreated: string,
  dateModified: string,
  statusHistory?: PlantingStatusHistoryRecord[],
}

export interface Planting {
  plantingId: string,
  plotId?: string,
  plantId: string,
  numberTransplanted?: number, // int
  currentPlantingYear: number, // int
  plantingYears: number[], // int
  name: string,
  seedSource?: string,
  lotNumber?: string,
  targetPlantingDate?: string, // YYYY-MM-DD
  leadTimeWeeks?: number, // int
  sowDate?: string, // YYYY-MM-DD
  sowType?: string,
  numberSown?: number, //int
  transplantDate?: string, // YYYY-MM-DD
  currentStatus: string,
  notes?: string,
  dateCreated?: string,
  dateModified?: string,
  statusHistory?: PlantingStatusHistoryRecord[],
}

export interface PlantingUpdateRequest {
  plantId?: string,
  name?: string,
  seedSource?: string,
  lotNumber?: string,
  targetPlantingDate?: string, // YYYY-MM-DD
  plotId?: string,
  numberTransplanted?: number, // int
  leadTimeWeeks?: number, // int
  sowDate?: string, // YYYY-MM-DD
  sowType?: string,
  numberSown?: number, //int
  transplantDate?: string, // YYYY-MM-DD
  notes?: string,
}

export interface PlantingUpdate {
  status: string,
  name?: string,
  plantId?: string,
  seedSource?: string,
  lotNumber?: string,
  plotId?: string,
  numberTransplanted?: number, // int
  targetPlantingDate?: string, // YYYY-MM-DD
  leadTimeWeeks?: number, // int
  sowDate?: string, // YYYY-MM-DD
  sowType?: string,
  numberSown?: number, //int
  transplantDate?: string, // YYYY-MM-DD
  notes?: string,
}

export interface PlantingIdRow extends RowDataPacket {
  planting_id: string,
}

export interface PlantingRow extends RowDataPacket  {
  planting_id: string,
  plot_id: string,
  plant_id: string,
  number_transplanted: number, // int
  current_planting_year: number, // int
  planting_name: string,
  seed_source: string,
  target_planting_date: string,
  lot_number: string,
  lead_time_weeks: number, // int
  sow_date: string,
  sow_type: string,
  number_sown: number, //int
  transplant_date: string,
  current_status: string,
  notes: string,
  date_created: string,
  date_modified: string,
}

export interface PlantingStatusHistoryRecord {
  plantingHistoryId: number, //int
  plantingId: string,
  plantingStatus: string,
  comment: string,
  dateCreated: string,
  dateModified: string,
}

export interface PlantingStatusHistoryRow extends RowDataPacket {
  planting_history_id: number, //int
  planting_id: string,
  planting_status: string,
  comment: string,
  date_created: string,
  date_modified: string,
}

export interface PlantingPlantingYearRow extends RowDataPacket {
  planting_id: string,
  planting_year: number,
}
