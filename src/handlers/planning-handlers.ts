import { Request, Response } from 'express';
import planningSerializers from '../serializers/planning';
import planningService from '../services/planning/planning-service';
import tryDecorator from '../middleware/try-decorator';

async function getPlanningDetailsByYear(request: Request, response: Response) {
  const { plantingYear, } = request.params;

  if (plantingYear === undefined) {
    response.status(400).send('plantingYear required');
    return;
  }

  let plantingYearNumber: number;
  try {
    plantingYearNumber = parseInt(plantingYear!, 10);
  } catch (err) {
    response.status(400).send('plantingYear must be a number');
    return;
  }

  const planningDetails = await planningService.getPlanningDetailsForYear(plantingYearNumber);
  const planningDetailsResponse = planningSerializers.planningDetails.toResponse(planningDetails);

  response
    .status(200)
    .send(planningDetailsResponse);
}

export default {
  getPlanningDetailsByYear: tryDecorator.decorate(getPlanningDetailsByYear),
}
