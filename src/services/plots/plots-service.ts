import { v4 as uuidV4 } from 'uuid';

import { Plot, PlotRequest } from './types';

import datasource from './plots-mysql-datasource';
import { ensureError, FeralError } from '../../errors';
import { ConflictError, ValidationError } from '../../errors/common';

async function upsertPlot(plotRequest: PlotRequest): Promise<Plot> {
  const isUpdate = plotRequest.plotId !== undefined;

  // A new plot, or one saved under an id nothing holds, can't take a name another plot has: it's
  // refused by name, as the app shows a 400's reason. A rename onto one is the database's to refuse.
  if ((!isUpdate || !await datasource.plotExists(plotRequest.plotId!))
      && await datasource.friendlyNameIsTaken(plotRequest.friendlyName)) {
    throw new ValidationError('Friendly name already in use').withDebugParams({ friendlyName: plotRequest.friendlyName, });
  }

  try {
    const plot: Plot = {
      plotId: plotRequest.plotId ?? uuidV4(),
      friendlyName: plotRequest.friendlyName,
      lengthInInches: plotRequest.lengthInInches,
      widthInInches: plotRequest.widthInInches,
      plotType: plotRequest.plotType,
      isActive: plotRequest.isActive,
    };

    // an update by an id nothing holds is a 404 from the datasource, and writes nothing
    return isUpdate ? await datasource.updatePlot(plot) : await datasource.insertPlot(plot);
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
  const plantingCount: number = await datasource.countPlantingsByPlotId(plotId);

  if (plantingCount > 0) {
    throw new ConflictError('Plot has plantings').withDebugParams({ plotId, plantingCount, });
  }

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
