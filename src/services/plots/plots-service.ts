import { Plot, PlotRequest } from './types';

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

export default {
  upsertPlot,
  getPlotById,
  getPlots,
  deletePlotById,
}
