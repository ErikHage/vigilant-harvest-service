import { Request } from 'express';

import { PlotRequest, PlotResponse, Plot, PlotYearResponse, PlotYearRequest, PlotYear } from '../services/plots/types';

const plots = {
  fromRequest: (req: Request): PlotRequest => ({
    plotId: req.body.plotId,
    friendlyName: req.body.friendlyName,
    lengthInInches: req.body.lengthInInches,
    widthInInches: req.body.widthInInches,
    plotType: req.body.plotType,
    isActive: true,
  }),

  toResponse: (plot: Plot): PlotResponse => ({
    plotId: plot.plotId,
    friendlyName: plot.friendlyName,
    lengthInInches: plot.lengthInInches,
    widthInInches: plot.widthInInches,
    plotType: plot.plotType,
    isActive: plot.isActive,
  }),
};

const plotYears = {
  fromRequest: (req: Request): PlotYearRequest => ({
    plotYearId: req.body.plotYearId,
    plotId: req.body.plotId,
    numRows: req.body.numRows,
    numColumns: req.body.numColumns,
    year: req.body.year,
  }),

  toResponse: (plotYear: PlotYear): PlotYearResponse => ({
    plotYearId: plotYear.plotYearId,
    plotId: plotYear.plotId,
    numRows: plotYear.numRows,
    numColumns: plotYear.numColumns,
    year: plotYear.year,
  }),
};

export default {
  plots,
  plotYears,
}
