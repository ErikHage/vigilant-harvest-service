import { Request, Response } from 'express';

import harvestSerializers from '../serializers/harvests';
import harvestsService from '../services/harvests/harvests-service';
import {
  Harvest,
  HarvestRequest,
  HarvestResponse,
  HarvestSearchRequest,
  HarvestSummaryRequest
} from '../services/harvests/types';

async function insertHarvests(request: Request, response: Response) {
  const harvestRequests: HarvestRequest[] = harvestSerializers.insert.fromRequest(request);

  const harvests: Harvest[] = await harvestsService.insertHarvests(harvestRequests);
  const harvestsResponse: HarvestResponse[] = harvests.map(harvestSerializers.insert.toResponse);

  response.status(201).send(harvestsResponse);
}

async function getHarvestSummary(request: Request, response: Response) {
  const params: HarvestSummaryRequest = harvestSerializers.summary.fromRequest(request);

  const harvests = await harvestsService.getHarvestSummary(params);
  const harvestsResponse = harvests.map(harvestSerializers.summary.toResponse);

  response.status(200).send(harvestsResponse);
}

async function searchHarvests(request: Request, response: Response) {
  const params: HarvestSearchRequest = harvestSerializers.search.fromRequest(request);

  const harvests = await harvestsService.searchHarvests(params);

  response.status(200).send(harvests);
}

async function deleteHarvestById(request: Request, response: Response) {
  const { harvestId, } = request.params;

  if (harvestId === undefined) {
    response.status(400).send('harvestId required');
  }

  await harvestsService.deleteHarvestById(harvestId!);

  response.sendStatus(200);
}

export default {
  insertHarvests,
  getHarvestSummary,
  searchHarvests,
  deleteHarvestById,
}
