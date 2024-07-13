import { v4 as uuidV4 } from 'uuid';

import { Plot, PlotYear, PlotYearRequest } from './types';

const plotsStore = new Map<string, Plot>;
const plotYearsStore = new Map<string, PlotYear>;

function upsertPlot(plot: Plot): Plot {
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

function upsertPlotYear(plotYearRequest: PlotYearRequest): PlotYear {
  const plotYear: PlotYear = {
    plotYearId: plotYearRequest.plotYearId || uuidV4(),
    plotId: plotYearRequest.plotId,
    numRows: plotYearRequest.numRows,
    numColumns: plotYearRequest.numColumns,
    year: plotYearRequest.year,
  };

  plotYearsStore.set(plotYear.plotYearId, plotYear);
  return plotYear;
}

function getPlotYearById(plotYearId: string): PlotYear {
  if (plotYearsStore.has(plotYearId)) {
    return plotYearsStore.get(plotYearId)!;
  }
  throw new Error(`Plot year not found with id: ${plotYearId}`);
}

function getPlotYears(): PlotYear[] {
  return Array.from(plotYearsStore.values())
}

function deletePlotYearById(plotYearId: string) {
  plotYearsStore.delete(plotYearId);
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
