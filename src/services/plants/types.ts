import { RowDataPacket } from 'mysql2';

export interface PlantRequest {
  plantId: string | undefined,
  family: string,
  genus: string,
  species: string,
  friendlyName: string,
}

export interface PlantResponse {
  plantId: string,
  family: string,
  genus: string,
  species: string,
  friendlyName: string,
  dateCreated: Date,
  dateModified: Date,
}

export interface PlantRow extends RowDataPacket {
  plant_id: string,
  family: string,
  genus: string,
  species: string,
  friendly_name: string,
  date_created: Date,
  date_modified: Date,
}

export interface Plant {
  plantId: string,
  family: string,
  genus: string,
  species: string,
  friendlyName: string,
  dateCreated?: Date,
  dateModified?: Date,
}
