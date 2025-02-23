import { RowDataPacket } from 'mysql2';

export interface CreatePlantingRequest {
  plantId: string,
  plantingYear: number, // int
  name: string,
  leadTimeWeeks?: number, // int
  seedSource?: string,
  lotNumber?: string,
}

export interface PerformActionRequest {
  plantingId: string,
  actionType: string,
  sowActionData?: SowActionData,
  transplantActionData?: TransplantActionData,
  retireActionData?: RetireActionData,
}

export interface SowActionData {
  sowDate: Date,
  numberSown: number // int
}

export interface TransplantActionData {
  plotId: string,
  transplantDate: Date,
  numberTransplanted: number // int
}

export interface RetireActionData {

}

export interface PlantingRequest {
  plantingId: string | undefined,
  plantId: string,
  plantingYear: number, // int
  name: string,
  seedSource?: string,
  lotNumber?: string,
  plotId?: string,
  numberTransplanted?: number, // int
  leadTimeWeeks?: number, // int
  sowDate?: Date,
  sowType?: string,
  numberSown?: number, //int
  transplantDate?: Date,
  currentStatus?: string,
  notes: string[],
}

export interface PlantingResponse {
  plantingId: string,
  plotId?: string,
  plantId: string,
  numberTransplanted?: number, // int
  plantingYear: number, // int
  name: string,
  seedSource?: string,
  lotNumber?: string,
  leadTimeWeeks?: number, // int
  sowDate?: Date,
  sowType?: string,
  numberSown?: number, //int
  transplantDate?: Date,
  currentStatus?: string,
  notes: string[],
  dateCreated: Date,
  dateModified: Date,
}

export interface Planting {
  plantingId: string,
  plotId?: string,
  plantId: string,
  numberTransplanted?: number, // int
  plantingYear: number, // int
  name: string,
  seedSource?: string,
  lotNumber?: string,
  leadTimeWeeks?: number, // int
  sowDate?: Date,
  sowType?: string,
  numberSown?: number, //int
  transplantDate?: Date,
  currentStatus: string,
  notes: string[],
  dateCreated?: Date,
  dateModified?: Date,
}

export interface PlantingUpdate {
  status: string,
  plotId?: string,
  numberTransplanted?: number, // int
  leadTimeWeeks?: number, // int
  sowDate?: Date,
  sowType?: string,
  numberSown?: number, //int
  transplantDate?: Date,
}

export interface PlantingRow extends RowDataPacket  {
  planting_id: string,
  plot_id: string,
  plant_id: string,
  number_transplanted: number, // int
  planting_year: number, // int
  planting_name: string,
  seed_source: string,
  lot_number: string,
  lead_time_weeks: number, // int
  sow_date: Date,
  sow_type: string,
  number_sown: number, //int
  transplant_date: Date,
  current_status: string,
  notes: string,
  date_created: Date,
  date_modified: Date,
}
