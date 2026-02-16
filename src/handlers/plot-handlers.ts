import { Request, Response } from 'express';

import plotsService from '../services/plots/plots-service';
import plotSerializers from '../serializers/plots';
import tryDecorator from '../middleware/try-decorator';
import httpStatus from '../util/http-status';

async function upsertPlot(request: Request, response: Response) {
  const plotRequest = plotSerializers.plots.fromRequest(request);

  const plot = await plotsService.upsertPlot(plotRequest);
  const plotResponse = plotSerializers.plots.toResponse(plot);

  response
    .status(plotRequest.plotId === undefined ? httpStatus.CREATED : httpStatus.OK)
    .send(plotResponse)
}

async function getPlotById(request: Request, response: Response) {
  const { plotId, } = request.params;

  if (plotId === undefined) {
    response.status(httpStatus.BAD_REQUEST).send('plotId required');
  }

  const plot = await plotsService.getPlotById(plotId!);
  const plotResponse = plotSerializers.plots.toResponse(plot);

  response.status(httpStatus.OK).send(plotResponse)
}

async function getPlots(request: Request, response: Response) {
  const plots = await plotsService.getPlots();
  const plotsResponse = plots.map(plotSerializers.plots.toResponse);

  response.status(httpStatus.OK).send(plotsResponse);
}

async function deletePlotById(request: Request, response: Response) {
  const { plotId, } = request.params;

  if (plotId === undefined) {
    response.sendStatus(httpStatus.BAD_REQUEST);
  }

  await plotsService.deletePlotById(plotId!);

  response.sendStatus(httpStatus.OK);
}

export default {
  upsertPlot: tryDecorator.decorate(upsertPlot),
  getPlotById: tryDecorator.decorate(getPlotById),
  getPlots: tryDecorator.decorate(getPlots),
  deletePlotById: tryDecorator.decorate(deletePlotById),
}
