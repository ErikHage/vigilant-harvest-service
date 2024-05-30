import uuid from 'uuid';

import { Plot, PlotRequest, PlotYear, PlotYearRequest } from './types';

import datasource from './plots-mysql-datasource';

async function upsertPlot(plotRequest: PlotRequest): Promise<Plot> {
  try {
    const plot: Plot = {
      plotId: plotRequest.plotId || uuid.v4(),
      lengthInInches: plotRequest.lengthInInches,
      widthInInches: plotRequest.widthInInches,
      plotType: plotRequest.plotType,
      isActive: plotRequest.isActive || true,
    };

    return await datasource.upsertPlot(plot);
  } catch (err) {
    // log and wrap error
    throw err;
  }
}

async function getPlotById(plotId: string): Promise<Plot> {
  try {
    return await datasource.getPlotById(plotId);
  } catch (err) {
    // log and wrap error
    throw err;
  }
}

async function getPlots(): Promise<Plot[]> {
  try {
    return await datasource.getPlots();
  } catch (err) {
    // log and wrap error
    throw err;
  }
}

async function deletePlotById(plotId: string) {
  try {
    await datasource.deletePlotById(plotId);
  } catch (err) {
    // log and wrap error
    throw err;
  }
}

async function upsertPlotYear(plotYearRequest: PlotYearRequest): Promise<PlotYear> {
  try {
    return await datasource.upsertPlotYear(plotYearRequest);
  } catch (err) {
    // log and wrap error
    throw err;
  }
}

async function getPlotYearById(plotYearId: string): Promise<PlotYear> {
  try {
    return await datasource.getPlotYearById(plotYearId);
  } catch (err) {
    // log and wrap error
    throw err;
  }
}

async function getPlotYears(): Promise<PlotYear[]> {
  try {
    return await datasource.getPlotYears();
  } catch (err) {
    // log and wrap error
    throw err;
  }
}

async function deletePlotYearById(plotYearId: string) {
  try {
    await datasource.deletePlotYearById(plotYearId);
  } catch (err) {
    // log and wrap error
    throw err;
  }
}

export default {
  upsertPlot,
  getPlotById,
  getPlots,
  deletePlotById,
  upsertPlotYear,
  getPlotYearById,
  getPlotYears,
  deletePlotYearById,
}
