import { RowDataPacket } from 'mysql2';

export interface PlotRequest {
  plotId: string | undefined,
  friendlyName: string,
  lengthInInches: number, // int
  widthInInches: number, // int
  plotType: string,
  isActive: boolean | undefined,
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
  is_active: boolean,
}

export interface PlotYearRequest {
  plotYearId: string | undefined,
  plotId: string,
  numRows: number, // int
  numColumns: number, // int
  year: number, // int
}

export interface PlotYearResponse {
  plotYearId: string,
  plotId: string,
  numRows: number, // int
  numColumns: number, // int
  year: number, // int
}

export interface PlotYear {
  plotYearId: string,
  plotId: string,
  numRows: number, // int
  numColumns: number, // int
  year: number, // int
}

export interface PlotYearRow extends RowDataPacket {
  plot_year_id: string,
  plot_id: string,
  num_rows: number, // int
  num_columns: number, // int
  year: number, // int
}
