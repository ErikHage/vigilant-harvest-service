import { Request } from 'express';

import { PlotRequest, PlotResponse, Plot } from '../services/plots/types';

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

export default {
  plots,
}
