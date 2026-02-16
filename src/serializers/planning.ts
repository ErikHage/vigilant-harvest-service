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
    toResponse: (planningDetails: PlanningDetails): PlanningDetailsResponse => ({
      plantingYear: planningDetails.plantingYear,
      targetPlantingDay: planningDetails.targetPlantingDay,
      currentDay: planningDetails.currentDay,
      planning: {
        plantings: planningDetails.planning.plantings.map(toPlanningInstanceResponse),
      },
      propagation: {
        plantings: planningDetails.propagation.plantings.map(toPlanningInstanceResponse),
      },
    }),
  },
};
