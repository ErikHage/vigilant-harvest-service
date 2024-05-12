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
