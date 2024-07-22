import { Request, Response } from 'express';

import plantingSerializers from '../serializers/plantings';
import plantingsService from '../services/plantings/plantings-service';
import { Planting } from '../services/plantings/types';

async function upsertPlanting(request: Request, response: Response) {
  const plantingRequest = plantingSerializers.fromRequest(request);

  const planting = await plantingsService.upsertPlanting(plantingRequest);
  const plantingResponse = plantingSerializers.toResponse(planting);

  response
    .status(plantingRequest.plantingId === undefined ? 201 : 200)
    .send(plantingResponse)
}

async function getPlantingById(request: Request, response: Response) {
  const { plantingId, } = request.params;

  if (plantingId === undefined) {
    response.status(400).send('plantingId required');
  }

  const planting = await plantingsService.getPlantingById(plantingId!);
  const plantingResponse = plantingSerializers.toResponse(planting);

  response.status(200).send(plantingResponse);
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

  response.status(200).send(plantingsResponse);
}

async function deletePlantingById(request: Request, response: Response) {
  const { plantingId, } = request.params;

  if (plantingId === undefined) {
    response.sendStatus(400);
  }

  await plantingsService.deletePlantingById(plantingId!);

  response.sendStatus(200);
}


export default {
  upsertPlanting,
  getPlantingById,
  getPlantings,
  deletePlantingById,
}
