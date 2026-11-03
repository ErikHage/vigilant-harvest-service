import { Request } from 'express';

import { requiredYear } from '../validation';
import {
  PlanningDetails,
  PlanningDetailsResponse,
  PlanningInstance,
  PlanningInstanceResponse
} from '../services/planning/types';

function toPlanningInstanceResponse(instance: PlanningInstance): PlanningInstanceResponse {
  return {
    plantingId: instance.plantingId,
    plantingName: instance.plantingName,
    plantId: instance.plantId,
    plantName: instance.plantName,
    plannedActionDay: instance.plannedActionDay,
    daysUntilAction: instance.daysUntilAction,
  };
}

export default {
  planningDetails: {
    fromRequest: (req: Request): number => requiredYear(req.params.plantingYear, 'plantingYear'),

    toResponse: (planningDetails: PlanningDetails): PlanningDetailsResponse => ({
      plantingYear: planningDetails.plantingYear,
      targetPlantingDay: planningDetails.targetPlantingDay,
      currentDay: planningDetails.currentDay,
      toStart: {
        plantings: planningDetails.toStart.plantings.map(toPlanningInstanceResponse),
      },
      toPlant: {
        plantings: planningDetails.toPlant.plantings.map(toPlanningInstanceResponse),
      },
    }),
  },
};
