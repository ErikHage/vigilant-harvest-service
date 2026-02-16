import { Request, Response } from 'express';

import plantingYearSerializers from '../serializers/planting-years';
import plantingYearsService from '../services/planting-years/planting-years-service';
import tryDecorator from '../middleware/try-decorator';
import httpStatus from '../util/http-status';

async function insertPlantingYear(request: Request, response: Response) {
  const plantingRequest = plantingYearSerializers.fromRequest(request);

  await plantingYearsService.insertPlantingYear(plantingRequest);

  response.sendStatus(httpStatus.CREATED);
}

async function getPlantingYears(request: Request, response: Response) {

  const plantingYears = await plantingYearsService.getPlantingYears();

  const plantingYearsResponse = plantingYears.map(plantingYearSerializers.toResponse);

  response
    .status(httpStatus.OK)
    .send(plantingYearsResponse);
}

async function getPlantingYear(request: Request, response: Response) {
  const year = plantingYearSerializers.get.fromRequest(request);

  const plantingYear = await plantingYearsService.getPlantingYear(year);

  const plantingYearResponse = plantingYearSerializers.toResponse(plantingYear);

  response
    .status(httpStatus.OK)
    .send(plantingYearResponse);
}

export default {
  insertPlantingYear: tryDecorator.decorate(insertPlantingYear),
  getPlantingYears: tryDecorator.decorate(getPlantingYears),
  getPlantingYear: tryDecorator.decorate(getPlantingYear),
}
