import { Request, Response } from 'express';

import plantingYearSerializers from '../serializers/planting-years';
import plantingYearsService from '../services/planting-years/planting-years-service';
import tryDecorator from '../middleware/try-decorator';

async function insertPlantingYear(request: Request, response: Response) {
  const plantingRequest = plantingYearSerializers.fromRequest(request);

  await plantingYearsService.insertPlantingYear(plantingRequest);

  response.sendStatus(201);
}

async function getPlantingYears(request: Request, response: Response) {

  const plantingYears = await plantingYearsService.getPlantingYears();

  const plantingYearsResponse = plantingYears.map(plantingYearSerializers.toResponse);

  response
    .status(200)
    .send(plantingYearsResponse);
}

export default {
  insertPlantingYear: tryDecorator.decorate(insertPlantingYear),
  getPlantingYears: tryDecorator.decorate(getPlantingYears),
}
