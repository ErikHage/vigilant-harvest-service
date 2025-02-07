import { v4 as uuidV4 } from 'uuid';

import { Plot, PlotRequest } from './types';

import datasource from './plots-mysql-datasource';
import { ensureError, FeralError } from '../../errors';

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
    throw new FeralError('Error upserting plot', ensureError(err))
      .withDebugParams(plotRequest);
  }
}

async function getPlotById(plotId: string): Promise<Plot> {
  try {
    return await datasource.getPlotById(plotId);
  } catch (err) {
    throw new FeralError('Error fetching plot by id', ensureError(err))
      .withDebugParams({ plotId, });
  }
}

async function getPlots(): Promise<Plot[]> {
  try {
    return await datasource.getPlots();
  } catch (err) {
    throw new FeralError('Error fetching all plots', ensureError(err));
  }
}

async function deletePlotById(plotId: string) {
  try {
    await datasource.deletePlotById(plotId);
  } catch (err) {
    throw new FeralError('Error deleting plot by id', ensureError(err))
      .withDebugParams({ plotId, });
  }
}

export default {
  upsertPlot,
  getPlotById,
  getPlots,
  deletePlotById,
}
