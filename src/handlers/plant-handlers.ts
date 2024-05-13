import { Request, Response } from 'express';

import plantSerializers from '../serializers/plants';
import plantsService from '../services/plants/plants-service';

async function upsertPlant(request: Request, response: Response) {
  const plantRequest = plantSerializers.fromRequest(request);

  const planting = await plantsService.upsertPlant(plantRequest);
  const plantResponse = plantSerializers.toResponse(planting);

  response
    .status(plantRequest.plantId === undefined ? 201 : 200)
    .send(plantResponse)
}

async function getPlantById(request: Request, response: Response) {
  const { plantId, } = request.params;

  if (plantId === undefined) {
    response.status(400).send('plantId required');
  }

  const plant = await plantsService.getPlantById(plantId!);
  const plantResponse = plantSerializers.toResponse(plant);

  response.status(200).send(plantResponse);
}

async function getPlants(request: Request, response: Response) {
  const plants = await plantsService.getPlants();
  const plantsResponse = plants.map(plantSerializers.toResponse);

  response.status(200).send(plantsResponse);
}

async function deletePlantById(request: Request, response: Response) {
  const { plantId, } = request.params;

  if (plantId === undefined) {
    response.sendStatus(400);
  }

  await plantsService.deletePlantById(plantId!);

  response.sendStatus(200);
}

export default {
  upsertPlant,
  getPlantById,
  getPlants,
  deletePlantById,
}
