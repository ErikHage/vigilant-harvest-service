import { Request, Response } from 'express';

import plantingSerializers from '../serializers/plantings';
import plantingsService from '../services/plantings/plantings-service';
import { PerformActionRequest, Planting, PlantingResponse, PlantingUpdateRequest } from '../services/plantings/types';
import tryDecorator from '../middleware/try-decorator';
import httpStatus from '../util/http-status';

async function createPlanting(request: Request, response: Response) {
  const plantingRequest = plantingSerializers.insert.fromRequest(request);

  const planting = await plantingsService.createPlanting(plantingRequest);
  const plantingResponse = plantingSerializers.toResponse(planting);

  response
    .status(httpStatus.CREATED)
    .send(plantingResponse)
}

async function performPlantingAction(request: Request, response: Response) {
  const performActionRequest: PerformActionRequest = plantingSerializers.action.fromRequest(request);

  const planting: Planting = await plantingsService.performAction(performActionRequest);
  const plantingResponse: PlantingResponse = plantingSerializers.toResponse(planting);

  response
    .status(httpStatus.OK)
    .send(plantingResponse)
}

async function updatePlanting(request: Request, response: Response) {
  const { plantingId, } = request.params;

  if (plantingId === undefined) {
    response.status(httpStatus.BAD_REQUEST).send('plantingId required');
  }

  const plantingUpdateRequest: PlantingUpdateRequest = plantingSerializers.update.fromRequest(request);

  const planting: Planting = await plantingsService.updatePlanting(plantingId!, plantingUpdateRequest);
  const plantingResponse: PlantingResponse = plantingSerializers.toResponse(planting);

  response
    .status(httpStatus.OK)
    .send(plantingResponse)
}

async function getPlantingById(request: Request, response: Response) {
  const { plantingId, } = request.params;

  if (plantingId === undefined) {
    response.status(httpStatus.BAD_REQUEST).send('plantingId required');
  }

  const planting = await plantingsService.getPlantingById(plantingId!);
  const plantingResponse = plantingSerializers.toResponse(planting);

  response.status(httpStatus.OK).send(plantingResponse);
}

async function getPlantings(request: Request, response: Response) {
  const { plantingYear, } = request.query;

  let plantings: Planting[];
  if (plantingYear !== undefined) {
    const plantingYearParsed = +plantingYear;
    plantings = await plantingsService.getPlantingsByYear(plantingYearParsed);
  } else {
    plantings = await plantingsService.getPlantings();
  }

  const plantingsResponse = plantings.map(plantingSerializers.toResponse);

  response.status(httpStatus.OK).send(plantingsResponse);
}

async function deletePlantingById(request: Request, response: Response) {
  const { plantingId, } = request.params;

  if (plantingId === undefined) {
    response.sendStatus(httpStatus.BAD_REQUEST);
  }

  await plantingsService.deletePlantingById(plantingId!);

  response.sendStatus(httpStatus.OK);
}


export default {
  createPlanting: tryDecorator.decorate(createPlanting),
  performPlantingAction: tryDecorator.decorate(performPlantingAction),
  updatePlanting: tryDecorator.decorate(updatePlanting),
  getPlantingById: tryDecorator.decorate(getPlantingById),
  getPlantings: tryDecorator.decorate(getPlantings),
  deletePlantingById: tryDecorator.decorate(deletePlantingById),
}
