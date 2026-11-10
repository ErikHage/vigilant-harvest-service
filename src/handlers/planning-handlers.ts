import { Request, Response } from 'express';
import planningSerializers from '../serializers/planning';
import planningService from '../services/planning/planning-service';
import tryDecorator from '../middleware/try-decorator';
import httpStatus from '../util/http-status';

async function getPlanningDetailsByYear(request: Request, response: Response) {
  const planningRequest = planningSerializers.planningDetails.fromRequest(request);

  const planningDetails = await planningService.getPlanningDetailsForYear(planningRequest);
  const planningDetailsResponse = planningSerializers.planningDetails.toResponse(planningDetails);

  response
    .status(httpStatus.OK)
    .send(planningDetailsResponse);
}

export default {
  getPlanningDetailsByYear: tryDecorator.decorate(getPlanningDetailsByYear),
}
