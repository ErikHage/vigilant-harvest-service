import { RowDataPacket } from 'mysql2';

// seeded as harvest_type_id 1 by migration 20260617232238, and the column default for
// plants.default_harvest_type_id and harvests.harvest_type_id
export const UNSPECIFIED_HARVEST_TYPE_ID: number = 1;

export interface HarvestType {
  harvestTypeId: number, // int
  harvestTypeName: string,
}

export interface HarvestTypeRow extends RowDataPacket {
  harvest_type_id: number, // int
  harvest_type_name: string,
}

export interface HarvestTypeResponse {
  harvestTypeId: number, // int
  harvestTypeName: string,
}
