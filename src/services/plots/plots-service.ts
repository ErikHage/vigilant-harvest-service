import { Plot, PlotRequest, PlotYear, PlotYearRequest } from './types';

import inMemoryDatasource from './plots-in-memory-datasource';

async function upsertPlot(plot: PlotRequest): Promise<Plot> {
  try {
    return await inMemoryDatasource.upsertPlot(plot);
  } catch (err) {
    // log and wrap error
    throw err;
  }
}

async function getPlotById(plotId: string): Promise<Plot> {
  try {
    return await inMemoryDatasource.getPlotById(plotId);
  } catch (err) {
    // log and wrap error
    throw err;
  }
}

async function getPlots(): Promise<Plot[]> {
  try {
    return await inMemoryDatasource.getPlots();
  } catch (err) {
    // log and wrap error
    throw err;
  }
}

async function deletePlotById(plotId: string) {
  try {
    await inMemoryDatasource.deletePlotById(plotId);
  } catch (err) {
    // log and wrap error
    throw err;
  }
}

async function upsertPlotYear(plotYearRequest: PlotYearRequest): Promise<PlotYear> {
  try {
    return await inMemoryDatasource.upsertPlotYear(plotYearRequest);
  } catch (err) {
    // log and wrap error
    throw err;
  }
}

async function getPlotYearById(plotYearId: string): Promise<PlotYear> {
  try {
    return await inMemoryDatasource.getPlotYearById(plotYearId);
  } catch (err) {
    // log and wrap error
    throw err;
  }
}

async function getPlotYears(): Promise<PlotYear[]> {
  try {
    return await inMemoryDatasource.getPlotYears();
  } catch (err) {
    // log and wrap error
    throw err;
  }
}

async function deletePlotYearById(plotYearId: string) {
  try {
    await inMemoryDatasource.deletePlotYearById(plotYearId);
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
