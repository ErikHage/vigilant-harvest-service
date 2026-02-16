import { Request, Response } from 'express';

import plantSerializers from '../serializers/plants';
import plantsService from '../services/plants/plants-service';
import tryDecorator from '../middleware/try-decorator';
import httpStatus from '../util/http-status';

async function upsertPlant(request: Request, response: Response) {
  const plantRequest = plantSerializers.fromRequest(request);

  const planting = await plantsService.upsertPlant(plantRequest);
  const plantResponse = plantSerializers.toResponse(planting);

  response
    .status(plantRequest.plantId === undefined ? httpStatus.CREATED : httpStatus.OK)
    .send(plantResponse);
}

async function getPlantById(request: Request, response: Response) {
  const { plantId, } = request.params;

  if (plantId === undefined) {
    response.status(httpStatus.BAD_REQUEST).send('plantId required');
  }

  const plant = await plantsService.getPlantById(plantId!);
  const plantResponse = plantSerializers.toResponse(plant);

  response.status(httpStatus.OK).send(plantResponse);
}

async function getPlants(request: Request, response: Response) {
  const plants = await plantsService.getPlants();
  const plantsResponse = plants.map(plantSerializers.toResponse);

  response.status(httpStatus.OK).send(plantsResponse);
}

async function deletePlantById(request: Request, response: Response) {
  const { plantId, } = request.params;

  if (plantId === undefined) {
    response.sendStatus(httpStatus.BAD_REQUEST);
  }

  await plantsService.deletePlantById(plantId!);

  response.sendStatus(httpStatus.OK);
}

export default {
  upsertPlant: tryDecorator.decorate(upsertPlant),
  getPlantById: tryDecorator.decorate(getPlantById),
  getPlants: tryDecorator.decorate(getPlants),
  deletePlantById: tryDecorator.decorate(deletePlantById),
}
