import { RowDataPacket } from 'mysql2';

export interface PlotRequest {
  plotId: string | undefined,
  friendlyName: string,
  lengthInInches: number, // int
  widthInInches: number, // int
  plotType: string,
  isActive: boolean, // true when it isn't sent
}

export interface PlotResponse {
  plotId: string,
  friendlyName: string,
  lengthInInches: number, // int
  widthInInches: number, // int
  plotType: string,
  isActive: boolean,
}

export interface Plot {
  plotId: string,
  friendlyName: string,
  lengthInInches: number, // int
  widthInInches: number, // int
  plotType: string,
  isActive: boolean,
}

export interface PlotRow extends RowDataPacket {
  plot_id: string,
  friendly_name: string,
  length_in_inches: number, // int
  width_in_inches: number, // int
  plot_type: string,
  is_active: number, // TINYINT: 1 or 0
}

