import { Request, Response } from 'express';

import harvestSerializers from '../serializers/harvests';
import harvestsService from '../services/harvests/harvests-service';

async function upsertHarvest(request: Request, response: Response) {
  const harvestRequest = harvestSerializers.fromRequest(request);

  const harvest = await harvestsService.upsertHarvest(harvestRequest);
  const harvestResponse = harvestSerializers.toResponse(harvest);

  response
    .status(harvestRequest.harvestId === undefined ? 201 : 200)
    .send(harvestResponse);
}

async function getHarvestById(request: Request, response: Response) {
  const { harvestId, } = request.params;

  if (harvestId === undefined) {
    response.status(400).send('harvestId required');
  }

  const harvest = await harvestsService.getHarvestById(harvestId!);
  const harvestResponse = harvestSerializers.toResponse(harvest);

  response.status(200).send(harvestResponse);
}

async function getHarvests(request: Request, response: Response) {
  const harvests = await harvestsService.getHarvests();
  const harvestsResponse = harvests.map(harvestSerializers.toResponse);

  response.status(200).send(harvestsResponse);
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
  upsertHarvest,
  getHarvestById,
  getHarvests,
  deleteHarvestById,
}
