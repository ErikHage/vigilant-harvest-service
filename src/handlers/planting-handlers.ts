import { Request, Response } from 'express';

import plantingSerializers from '../serializers/plantings';
import plantingsService from '../services/plantings/plantings-service';

async function upsertPlanting(request: Request, response: Response) {
  const plantingRequest = plantingSerializers.fromRequest(request);

  const planting = await plantingsService.upsertPlanting(plantingRequest);
  const plantingResponse = plantingSerializers.toResponse(planting);

  response
    .status(plantingRequest.plantingId === undefined ? 201 : 200)
    .send(plantingResponse)
}

export default {
  upsertPlanting,
}
