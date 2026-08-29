import { Request, Response } from 'express';

import harvestTypeSerializers from '../serializers/harvest-types';
import harvestTypesService from '../services/harvest-types/harvest-types-service';
import tryDecorator from '../middleware/try-decorator';
import httpStatus from '../util/http-status';

async function getHarvestTypes(request: Request, response: Response) {
  const harvestTypes = await harvestTypesService.getHarvestTypes();
  const harvestTypesResponse = harvestTypes.map(harvestTypeSerializers.toResponse);

  response.status(httpStatus.OK).send(harvestTypesResponse);
}

export default {
  getHarvestTypes: tryDecorator.decorate(getHarvestTypes),
}
