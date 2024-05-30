import { RowDataPacket } from 'mysql2';

export interface PlotRequest {
  plotId: string | undefined,
  lengthInInches: number, // int
  widthInInches: number, // int
  plotType: string,
  isActive: boolean | undefined,
}

export interface PlotResponse {
  plotId: string,
  lengthInInches: number, // int
  widthInInches: number, // int
  plotType: string,
  isActive: boolean,
}

export interface Plot {
  plotId: string,
  lengthInInches: number, // int
  widthInInches: number, // int
  plotType: string,
  isActive: boolean,
}

export interface PlotRow extends RowDataPacket {
  plotId: string,
  length_in_inches: number, // int
  width_in_inches: number, // int
  plot_type: string,
  isActive: boolean,
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
