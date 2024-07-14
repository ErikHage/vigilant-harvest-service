import { Request, Response } from 'express';

import plotsService from '../services/plots/plots-service';
import plotSerializers from '../serializers/plots';

async function upsertPlot(request: Request, response: Response) {
  const plotRequest = plotSerializers.plots.fromRequest(request);

  const plot = await plotsService.upsertPlot(plotRequest);
  const plotResponse = plotSerializers.plots.toResponse(plot);

  response
    .status(plotRequest.plotId === undefined ? 201 : 200)
    .send(plotResponse)
}

async function getPlotById(request: Request, response: Response) {
  const { plotId, } = request.params;

  if (plotId === undefined) {
    response.status(400).send('plotId required');
  }

  const plot = await plotsService.getPlotById(plotId!);
  const plotResponse = plotSerializers.plots.toResponse(plot);

  response.status(200).send(plotResponse)
}

async function getPlots(request: Request, response: Response) {
  const plots = await plotsService.getPlots();
  const plotsResponse = plots.map(plotSerializers.plots.toResponse);

  response.status(200).send(plotsResponse);
}

async function deletePlotById(request: Request, response: Response) {
  const { plotId, } = request.params;

  if (plotId === undefined) {
    response.sendStatus(400);
  }

  await plotsService.deletePlotById(plotId!);

  response.sendStatus(200);
}

async function upsertPlotYear(request: Request, response: Response) {
  const plotYearRequest = plotSerializers.plotYears.fromRequest(request);

  const plotYear = await plotsService.upsertPlotYear(plotYearRequest);
  const plotYearResponse = plotSerializers.plotYears.toResponse(plotYear);

  response
    .status(plotYearRequest.plotYearId === undefined ? 201 : 200)
    .send(plotYearResponse)
}

async function getPlotYearById(request: Request, response: Response) {
  const { plotYearId, } = request.params;

  if (plotYearId === undefined) {
    response.status(400).send('plotYearId required');
  }

  const plotYear = await plotsService.getPlotYearById(plotYearId!);
  const plotYearResponse = plotSerializers.plotYears.toResponse(plotYear);

  response.status(200).send(plotYearResponse)
}

async function getPlotYears(request: Request, response: Response) {
  const plotYears = await plotsService.getPlotYears();
  const plotYearsResponse = plotYears.map(plotSerializers.plotYears.toResponse);

  response.status(200).send(plotYearsResponse);
}

async function deletePlotYearById(request: Request, response: Response) {
  const { plotId, } = request.params;

  if (plotId === undefined) {
    response.sendStatus(400);
  }

  await plotsService.deletePlotYearById(plotId!);

  response.sendStatus(200);
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
