import { PlantingAction } from './planting-action';
import { PerformActionRequest, Planting } from '../types';

import datasource from '../plantings-mysql-datasource';
import { FeralError } from '../../../errors';
import constants from '../../../util/constants';

export class StartAction implements PlantingAction {

  async performAction(currentPlanting: Planting, plantingActionRequest: PerformActionRequest): Promise<Planting> {
    try {
      await datasource.updatePlanting(plantingActionRequest.plantingId, {
        status: constants.plantings.statuses.started,
        ...plantingActionRequest.sowActionData,
      });
      await datasource.insertStatusHistory(
        plantingActionRequest.plantingId,
        constants.plantings.statuses.started,
        plantingActionRequest.sowActionData?.comment ?? '---');
    } catch (err) {
      throw new SowActionError().withDebugParams({ plantingActionRequest, });
    }

    return await datasource.getPlantingById(plantingActionRequest.plantingId);
  }
}

class SowActionError extends FeralError {
  constructor() {
    super('Error performing START action for planting');
  }
}
