import uuid from 'uuid';

import { Plot, PlotRequest } from './types';

const plotsStore = new Map<string, Plot>;

function upsertPlot(plotRequest: PlotRequest): Plot {
  const plot: Plot = {
    plotId: plotRequest.plotId || uuid.v4(),
    lengthInInches: plotRequest.lengthInInches,
    widthInInches: plotRequest.widthInInches,
    plotType: plotRequest.plotType,
    isActive: plotRequest.isActive || true,
  };

  plotsStore.set(plot.plotId, plot);
  return plot;
}

function getPlotById(plotId: string): Plot {
  if (plotsStore.has(plotId)) {
    return plotsStore.get(plotId)!;
  }
  throw new Error(`Plot not found with id: ${plotId}`);
}

function getPlots(): Plot[] {
  return Array.from(plotsStore.values())
}

function deletePlotById(plotId: string) {
  plotsStore.delete(plotId);
}

export default {
  upsertPlot,
  getPlotById,
  getPlots,
  deletePlotById,
}
