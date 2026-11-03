import { Request } from 'express';

import { PlotRequest, PlotResponse, Plot } from '../services/plots/types';
import { blankAsMissing, bodyOf, INT_MAX, optionalString, requiredInteger, requiredString } from '../validation';

const NAME = { maxLength: 255, };
const INCHES = { min: 0, max: INT_MAX, };

const plots = {
  fromRequest: (req: Request): PlotRequest => {
    const body = bodyOf(req);

    return {
      // the app's dialog sends '' for a new plot, which is then created, and answered 201
      plotId: optionalString(blankAsMissing(body.plotId), 'plotId', { maxLength: 36, }),
      friendlyName: requiredString(body.friendlyName, 'friendlyName', NAME),
      // its number boxes send '' when cleared (v-model.number), which reads as missing
      lengthInInches: requiredInteger(blankAsMissing(body.lengthInInches), 'lengthInInches', INCHES),
      widthInInches: requiredInteger(blankAsMissing(body.widthInInches), 'widthInInches', INCHES),
      plotType: requiredString(body.plotType, 'plotType', NAME),
      // isActive is not read; that it is ignored is a pinned behaviour, not this check's to change
      isActive: true,
    };
  },

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
