export interface PlotRequest {
  plotId: string | undefined,
  lengthInInches: number,
  widthInInches: number,
  plotType: string,
  isActive: boolean | undefined,
}

export interface PlotResponse {
  plotId: string,
  lengthInInches: number,
  widthInInches: number,
  plotType: string,
  isActive: boolean,
}

export interface Plot {
  plotId: string,
  lengthInInches: number,
  widthInInches: number,
  plotType: string,
  isActive: boolean,
}

export interface PlotYearRequest {
  plotYearId: string | undefined,
  plotId: string,
  numRows: number,
  numColumns: number,
  year: number,
}

export interface PlotYearResponse {
  plotYearId: string,
  plotId: string,
  numRows: number,
  numColumns: number,
  year: number,
}

export interface PlotYear {
  plotYearId: string,
  plotId: string,
  numRows: number,
  numColumns: number,
  year: number,
}
