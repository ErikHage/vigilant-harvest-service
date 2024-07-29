import { v4 as uuidV4 } from 'uuid';

import { Plot, PlotRequest } from './types';

import datasource from './plots-mysql-datasource';

async function upsertPlot(plotRequest: PlotRequest): Promise<Plot> {
  try {
    const plot: Plot = {
      plotId: plotRequest.plotId || uuidV4(),
      friendlyName: plotRequest.friendlyName,
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

export default {
  upsertPlot,
  getPlotById,
  getPlots,
  deletePlotById,
}
