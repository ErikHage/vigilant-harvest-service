import { Request, Response } from 'express';

import harvestSerializers from '../serializers/harvests';
import harvestsService from '../services/harvests/harvests-service';
import {
  Harvest,
  HarvestRequest,
  HarvestResponse,
  HarvestSearchRequest, HarvestStats, HarvestStatsRequest,
  HarvestSummaryRequest
} from '../services/harvests/types';
import tryDecorator from '../middleware/try-decorator';
import httpStatus from '../util/http-status';

async function upsertHarvests(request: Request, response: Response) {
  const harvestRequests: HarvestRequest[] = harvestSerializers.insert.fromRequest(request);

  const harvests: Harvest[] = await harvestsService.upsertHarvests(harvestRequests);
  const harvestsResponse: HarvestResponse[] = harvests.map(harvestSerializers.insert.toResponse);

  response.status(httpStatus.CREATED).send(harvestsResponse);
}

async function getHarvestSummary(request: Request, response: Response) {
  const params: HarvestSummaryRequest = harvestSerializers.summary.fromRequest(request);

  const harvests = await harvestsService.getHarvestSummary(params);
  const harvestsResponse = harvests.map(harvestSerializers.summary.toResponse);

  response.status(httpStatus.OK).send(harvestsResponse);
}

async function searchHarvests(request: Request, response: Response) {
  const params: HarvestSearchRequest = harvestSerializers.search.fromRequest(request);

  const harvests = await harvestsService.searchHarvests(params);
  const harvestsResponse = harvests.map(harvestSerializers.search.toResponse);

  response.status(httpStatus.OK).send(harvestsResponse);
}

async function getHarvestStats(request: Request, response: Response) {
  const params: HarvestStatsRequest = harvestSerializers.stats.fromRequest(request);

  const stats: HarvestStats = await harvestsService.getHarvestStats(params);
  const statsResponse = harvestSerializers.stats.toResponse(stats);

  response.status(httpStatus.OK).send(statsResponse);
}

async function deleteHarvestById(request: Request, response: Response) {
  const { harvestId, } = request.params;

  if (harvestId === undefined) {
    response.status(httpStatus.BAD_REQUEST).send('harvestId required');
  }

  await harvestsService.deleteHarvestById(harvestId!);

  response.sendStatus(httpStatus.OK);
}

export default {
  upsertHarvests: tryDecorator.decorate(upsertHarvests),
  getHarvestSummary: tryDecorator.decorate(getHarvestSummary),
  searchHarvests: tryDecorator.decorate(searchHarvests),
  getHarvestStats: tryDecorator.decorate(getHarvestStats),
  deleteHarvestById: tryDecorator.decorate(deleteHarvestById),
}
